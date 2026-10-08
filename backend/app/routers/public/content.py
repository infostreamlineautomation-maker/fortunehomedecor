from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.core.database import get_db
from app.models import Category, Faq, PageSection, Product, SiteSetting
from app.schemas.content import CategoryCard, CategoryDetail, FaqOut, PageOut, ProductDetail, ProductOut, SearchResult
from app.services.search import search

router = APIRouter(tags=["content"])

PAGES = ("home", "about", "contact", "products")


def _active_faqs(db: Session, category_id: int | None) -> list[Faq]:
    stmt = select(Faq).where(Faq.is_active, Faq.category_id.is_(None) if category_id is None else Faq.category_id == category_id)
    return list(db.scalars(stmt.order_by(Faq.sequence, Faq.id)))


@router.get("/settings")
def get_settings(db: Session = Depends(get_db)) -> dict[str, dict]:
    """Brand, contact details, socials, footer and SEO defaults."""
    return {s.key: s.value for s in db.scalars(select(SiteSetting))}


@router.get("/pages/{page}", response_model=PageOut)
def get_page(page: str, db: Session = Depends(get_db)):
    if page not in PAGES:
        raise HTTPException(404, "Page not found")
    sections = db.scalars(
        select(PageSection).where(PageSection.page == page, PageSection.is_active).order_by(PageSection.sequence)
    )
    return PageOut(page=page, sections={s.key: s.content for s in sections})


@router.get("/categories", response_model=list[CategoryCard])
def list_categories(db: Session = Depends(get_db)):
    return db.scalars(select(Category).where(Category.is_active).order_by(Category.sequence, Category.id)).all()


@router.get("/categories/{slug}", response_model=CategoryDetail)
def get_category(slug: str, db: Session = Depends(get_db)):
    category = db.scalar(select(Category).where(Category.slug == slug, Category.is_active))
    if category is None:
        raise HTTPException(404, "Category not found")
    detail = CategoryDetail.model_validate(category)
    detail.products = [ProductOut.model_validate(p) for p in category.products if p.is_active]
    detail.faqs = [FaqOut.model_validate(f) for f in _active_faqs(db, category.id)]
    return detail


@router.get("/products/{slug}", response_model=ProductDetail)
def get_product(slug: str, db: Session = Depends(get_db)):
    product = db.scalar(
        select(Product)
        .join(Product.category)
        .where(Product.slug == slug, Product.is_active, Category.is_active)
        .options(selectinload(Product.category))
    )
    if product is None:
        raise HTTPException(404, "Product not found")
    return product


@router.get("/faqs", response_model=list[FaqOut])
def list_faqs(category: str | None = Query(default=None, description="Category slug; omit for global FAQs"), db: Session = Depends(get_db)):
    if category is None:
        return _active_faqs(db, None)
    cat_id = db.scalar(select(Category.id).where(Category.slug == category, Category.is_active))
    if cat_id is None:
        raise HTTPException(404, "Category not found")
    return _active_faqs(db, cat_id)


@router.get("/search", response_model=list[SearchResult])
def site_search(q: str = Query(min_length=1, max_length=100), db: Session = Depends(get_db)):
    return search(db, q)
