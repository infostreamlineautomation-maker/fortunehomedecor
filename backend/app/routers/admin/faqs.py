from fastapi import APIRouter, BackgroundTasks, Depends, Query, Request
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.deps import get_current_admin
from app.models import AdminUser, Category, Faq
from app.routers.admin._helpers import apply_update, get_or_404, next_sequence, reorder
from app.schemas.common import ReorderIn
from app.schemas.content import FaqAdmin, FaqCreate, FaqUpdate
from app.services import audit
from app.services.revalidate import revalidate_site

router = APIRouter(prefix="/faqs", tags=["faqs"])


def _scope(category_id: int | None):
    return Faq.category_id.is_(None) if category_id is None else Faq.category_id == category_id


def _tags(db: Session, category_id: int | None) -> list[str]:
    if category_id is None:
        return ["faqs", "search"]
    slug = db.scalar(select(Category.slug).where(Category.id == category_id))
    return ["faqs", "search", f"category:{slug}"]


@router.get("", response_model=list[FaqAdmin])
def list_faqs(
    category_id: int | None = Query(default=None, description="Omit for all FAQs"),
    global_only: bool = Query(default=False, description="Only FAQs not tied to a category"),
    db: Session = Depends(get_db),
):
    stmt = select(Faq)
    if global_only:
        stmt = stmt.where(Faq.category_id.is_(None))
    elif category_id is not None:
        stmt = stmt.where(Faq.category_id == category_id)
    return db.scalars(stmt.order_by(Faq.category_id.nulls_first(), Faq.sequence, Faq.id)).all()


@router.post("", response_model=FaqAdmin, status_code=201)
def create_faq(
    payload: FaqCreate,
    request: Request,
    background: BackgroundTasks,
    db: Session = Depends(get_db),
    admin: AdminUser = Depends(get_current_admin),
):
    if payload.category_id is not None:
        get_or_404(db, Category, payload.category_id, "Category")
    faq = Faq(**payload.model_dump(), sequence=next_sequence(db, Faq, _scope(payload.category_id)))
    db.add(faq)
    db.flush()
    audit.record(db, admin, "create", "faq", f"Created FAQ: {faq.question}", faq.id, request=request)
    db.commit()
    background.add_task(revalidate_site, *_tags(db, faq.category_id))
    return faq


@router.patch("/{faq_id}", response_model=FaqAdmin)
def update_faq(
    faq_id: int,
    payload: FaqUpdate,
    request: Request,
    background: BackgroundTasks,
    db: Session = Depends(get_db),
    admin: AdminUser = Depends(get_current_admin),
):
    faq = get_or_404(db, Faq, faq_id, "FAQ")
    old_category = faq.category_id
    if payload.category_id is not None:
        get_or_404(db, Category, payload.category_id, "Category")
    changes = apply_update(faq, payload)
    if changes:
        if "category_id" in changes:
            faq.sequence = next_sequence(db, Faq, _scope(faq.category_id))
        audit.record(db, admin, "update", "faq", f"Updated FAQ: {faq.question}", faq.id, changes, request)
        db.commit()
        background.add_task(revalidate_site, *_tags(db, faq.category_id), *_tags(db, old_category))
    return faq


@router.delete("/{faq_id}", status_code=204)
def delete_faq(
    faq_id: int,
    request: Request,
    background: BackgroundTasks,
    db: Session = Depends(get_db),
    admin: AdminUser = Depends(get_current_admin),
):
    faq = get_or_404(db, Faq, faq_id, "FAQ")
    tags = _tags(db, faq.category_id)
    audit.record(db, admin, "delete", "faq", f"Deleted FAQ: {faq.question}", faq.id, request=request)
    db.delete(faq)
    db.commit()
    background.add_task(revalidate_site, *tags)


@router.put("/reorder", status_code=204)
def reorder_faqs(
    payload: ReorderIn,
    request: Request,
    background: BackgroundTasks,
    category_id: int | None = Query(default=None, description="Omit to reorder global FAQs"),
    db: Session = Depends(get_db),
    admin: AdminUser = Depends(get_current_admin),
):
    reorder(db, Faq, payload.ids, _scope(category_id))
    audit.record(db, admin, "reorder", "faq", "Reordered FAQs", changes={"ids": payload.ids}, request=request)
    db.commit()
    background.add_task(revalidate_site, *_tags(db, category_id))
