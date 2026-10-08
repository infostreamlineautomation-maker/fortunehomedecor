from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.deps import get_current_admin
from app.models import AdminUser, Category, Product
from app.routers.admin._helpers import apply_update, get_or_404, next_sequence, reorder
from app.schemas.common import ReorderIn
from app.schemas.content import CategoryAdmin, CategoryCreate, CategoryUpdate
from app.services import audit
from app.services.revalidate import revalidate_site
from app.services.slug import unique_slug

router = APIRouter(prefix="/categories", tags=["categories"])


def _to_admin(db: Session, c: Category) -> CategoryAdmin:
    out = CategoryAdmin.model_validate(c)
    out.product_count = db.scalar(select(func.count()).where(Product.category_id == c.id)) or 0
    return out


def _check_slug(db: Session, slug: str, exclude_id: int | None = None) -> None:
    stmt = select(Category.id).where(Category.slug == slug)
    if exclude_id:
        stmt = stmt.where(Category.id != exclude_id)
    if db.scalar(stmt):
        raise HTTPException(409, f"Slug '{slug}' is already used by another category")


@router.get("", response_model=list[CategoryAdmin])
def list_categories(db: Session = Depends(get_db)):
    counts = dict(db.execute(select(Product.category_id, func.count()).group_by(Product.category_id)).all())
    items = []
    for c in db.scalars(select(Category).order_by(Category.sequence, Category.id)):
        out = CategoryAdmin.model_validate(c)
        out.product_count = counts.get(c.id, 0)
        items.append(out)
    return items


@router.get("/{category_id}", response_model=CategoryAdmin)
def get_category(category_id: int, db: Session = Depends(get_db)):
    return _to_admin(db, get_or_404(db, Category, category_id, "Category"))


@router.post("", response_model=CategoryAdmin, status_code=201)
def create_category(
    payload: CategoryCreate,
    request: Request,
    background: BackgroundTasks,
    db: Session = Depends(get_db),
    admin: AdminUser = Depends(get_current_admin),
):
    data = payload.model_dump()
    if data["slug"]:
        _check_slug(db, data["slug"])
    else:
        data["slug"] = unique_slug(db, Category, payload.name)
    category = Category(**data, sequence=next_sequence(db, Category))
    db.add(category)
    db.flush()
    audit.record(db, admin, "create", "category", f"Created category {category.name}", category.id, request=request)
    db.commit()
    background.add_task(revalidate_site, "categories", f"category:{category.slug}")
    return _to_admin(db, category)


@router.patch("/{category_id}", response_model=CategoryAdmin)
def update_category(
    category_id: int,
    payload: CategoryUpdate,
    request: Request,
    background: BackgroundTasks,
    db: Session = Depends(get_db),
    admin: AdminUser = Depends(get_current_admin),
):
    category = get_or_404(db, Category, category_id, "Category")
    old_slug = category.slug
    if payload.slug and payload.slug != category.slug:
        _check_slug(db, payload.slug, category.id)
    changes = apply_update(category, payload)
    if changes:
        audit.record(db, admin, "update", "category", f"Updated category {category.name}", category.id, changes, request)
        db.commit()
        background.add_task(revalidate_site, "categories", "search", f"category:{old_slug}", f"category:{category.slug}")
    return _to_admin(db, category)


@router.delete("/{category_id}", status_code=204)
def delete_category(
    category_id: int,
    request: Request,
    background: BackgroundTasks,
    db: Session = Depends(get_db),
    admin: AdminUser = Depends(get_current_admin),
):
    category = get_or_404(db, Category, category_id, "Category")
    product_count = db.scalar(select(func.count()).where(Product.category_id == category.id))
    if product_count:
        raise HTTPException(409, f"Move or delete its {product_count} product(s) first")
    audit.record(db, admin, "delete", "category", f"Deleted category {category.name}", category.id, request=request)
    db.delete(category)
    db.commit()
    background.add_task(revalidate_site, "categories", f"category:{category.slug}")


@router.put("/reorder", status_code=204)
def reorder_categories(
    payload: ReorderIn,
    request: Request,
    background: BackgroundTasks,
    db: Session = Depends(get_db),
    admin: AdminUser = Depends(get_current_admin),
):
    reorder(db, Category, payload.ids)
    audit.record(db, admin, "reorder", "category", "Reordered categories", changes={"ids": payload.ids}, request=request)
    db.commit()
    background.add_task(revalidate_site, "categories")
