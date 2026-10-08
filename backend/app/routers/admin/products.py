from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, Request
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, selectinload

from app.core.database import get_db
from app.deps import get_current_admin
from app.models import AdminUser, Category, Product
from app.routers.admin._helpers import apply_update, get_or_404, next_sequence, reorder
from app.schemas.common import RESERVED_PRODUCT_SLUGS, Page, ReorderIn
from app.schemas.content import ProductAdmin, ProductCreate, ProductUpdate
from app.services import audit
from app.services.revalidate import revalidate_site
from app.services.slug import unique_slug

router = APIRouter(prefix="/products", tags=["products"])


def _to_admin(p: Product) -> ProductAdmin:
    out = ProductAdmin.model_validate(p)
    out.category_name = p.category.name if p.category else ""
    return out


def _check_slug(db: Session, slug: str, exclude_id: int | None = None) -> None:
    if slug in RESERVED_PRODUCT_SLUGS:
        raise HTTPException(409, f"'{slug}' is reserved by the website; choose another slug")
    stmt = select(Product.id).where(Product.slug == slug)
    if exclude_id:
        stmt = stmt.where(Product.id != exclude_id)
    if db.scalar(stmt):
        raise HTTPException(409, f"Slug '{slug}' is already used by another product")


def _tags(p: Product, *extra: str) -> list[str]:
    return ["categories", "search", f"category:{p.category.slug}", f"product:{p.slug}", *extra]


@router.get("", response_model=Page[ProductAdmin])
def list_products(
    category_id: int | None = None,
    q: str | None = Query(default=None, max_length=100),
    active: bool | None = None,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    stmt = select(Product)
    if category_id is not None:
        stmt = stmt.where(Product.category_id == category_id)
    if active is not None:
        stmt = stmt.where(Product.is_active == active)
    if q:
        like = f"%{q}%"
        stmt = stmt.where(or_(Product.name.ilike(like), Product.slug.ilike(like)))
    total = db.scalar(select(func.count()).select_from(stmt.subquery())) or 0
    rows = db.scalars(
        stmt.options(selectinload(Product.category))
        .order_by(Product.category_id, Product.sequence, Product.id)
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    return Page(items=[_to_admin(p) for p in rows], total=total, page=page, page_size=page_size)


@router.get("/{product_id}", response_model=ProductAdmin)
def get_product(product_id: int, db: Session = Depends(get_db)):
    return _to_admin(get_or_404(db, Product, product_id, "Product"))


@router.post("", response_model=ProductAdmin, status_code=201)
def create_product(
    payload: ProductCreate,
    request: Request,
    background: BackgroundTasks,
    db: Session = Depends(get_db),
    admin: AdminUser = Depends(get_current_admin),
):
    get_or_404(db, Category, payload.category_id, "Category")
    data = payload.model_dump()
    if data["slug"]:
        _check_slug(db, data["slug"])
    else:
        data["slug"] = unique_slug(db, Product, payload.name, reserved=RESERVED_PRODUCT_SLUGS)
    product = Product(**data, sequence=next_sequence(db, Product, Product.category_id == payload.category_id))
    db.add(product)
    db.flush()
    db.refresh(product)
    audit.record(db, admin, "create", "product", f"Created product {product.name}", product.id, request=request)
    db.commit()
    background.add_task(revalidate_site, *_tags(product))
    return _to_admin(product)


@router.patch("/{product_id}", response_model=ProductAdmin)
def update_product(
    product_id: int,
    payload: ProductUpdate,
    request: Request,
    background: BackgroundTasks,
    db: Session = Depends(get_db),
    admin: AdminUser = Depends(get_current_admin),
):
    product = get_or_404(db, Product, product_id, "Product")
    old_tags = _tags(product)
    if payload.category_id is not None and payload.category_id != product.category_id:
        get_or_404(db, Category, payload.category_id, "Category")
    if payload.slug and payload.slug != product.slug:
        _check_slug(db, payload.slug, product.id)
    changes = apply_update(product, payload)
    if changes:
        if "category_id" in changes:
            product.sequence = next_sequence(db, Product, Product.category_id == product.category_id)
        audit.record(db, admin, "update", "product", f"Updated product {product.name}", product.id, changes, request)
        db.commit()
        db.refresh(product)
        background.add_task(revalidate_site, *_tags(product), *old_tags)
    return _to_admin(product)


@router.delete("/{product_id}", status_code=204)
def delete_product(
    product_id: int,
    request: Request,
    background: BackgroundTasks,
    db: Session = Depends(get_db),
    admin: AdminUser = Depends(get_current_admin),
):
    product = get_or_404(db, Product, product_id, "Product")
    tags = _tags(product)
    audit.record(db, admin, "delete", "product", f"Deleted product {product.name}", product.id, request=request)
    db.delete(product)
    db.commit()
    background.add_task(revalidate_site, *tags)


@router.put("/reorder", status_code=204)
def reorder_products(
    payload: ReorderIn,
    request: Request,
    background: BackgroundTasks,
    category_id: int = Query(description="Products are ordered within one category"),
    db: Session = Depends(get_db),
    admin: AdminUser = Depends(get_current_admin),
):
    category = get_or_404(db, Category, category_id, "Category")
    reorder(db, Product, payload.ids, Product.category_id == category_id)
    audit.record(db, admin, "reorder", "product", f"Reordered products in {category.name}", changes={"ids": payload.ids}, request=request)
    db.commit()
    background.add_task(revalidate_site, "categories", f"category:{category.slug}")
