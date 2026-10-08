import csv
import io
from datetime import date, datetime, time, timezone

from fastapi import APIRouter, Depends, Query, Request
from fastapi.responses import StreamingResponse
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, selectinload

from app.core.database import get_db
from app.deps import get_current_admin
from app.models import AdminUser, Enquiry
from app.routers.admin._helpers import apply_update, get_or_404
from app.schemas.common import Page
from app.schemas.enquiry import EnquiryAdmin, EnquiryStatus, EnquiryType, EnquiryUpdate
from app.services import audit

router = APIRouter(prefix="/enquiries", tags=["enquiries"])


def _to_admin(e: Enquiry) -> EnquiryAdmin:
    out = EnquiryAdmin.model_validate(e)
    out.category_name = e.category.name if e.category else None
    out.product_name = e.product.name if e.product else None
    return out


def _filtered(type_: str | None, status: str | None, q: str | None, date_from: date | None, date_to: date | None):
    stmt = select(Enquiry)
    if type_:
        stmt = stmt.where(Enquiry.type == type_)
    if status:
        stmt = stmt.where(Enquiry.status == status)
    if q:
        like = f"%{q}%"
        stmt = stmt.where(
            or_(Enquiry.name.ilike(like), Enquiry.email.ilike(like), Enquiry.phone.ilike(like), Enquiry.company.ilike(like))
        )
    if date_from:
        stmt = stmt.where(Enquiry.created_at >= datetime.combine(date_from, time.min, timezone.utc))
    if date_to:
        stmt = stmt.where(Enquiry.created_at <= datetime.combine(date_to, time.max, timezone.utc))
    return stmt


@router.get("", response_model=Page[EnquiryAdmin])
def list_enquiries(
    type: EnquiryType | None = None,
    status: EnquiryStatus | None = None,
    q: str | None = Query(default=None, max_length=100),
    date_from: date | None = None,
    date_to: date | None = None,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=25, ge=1, le=200),
    db: Session = Depends(get_db),
):
    stmt = _filtered(type, status, q, date_from, date_to)
    total = db.scalar(select(func.count()).select_from(stmt.subquery())) or 0
    rows = db.scalars(
        stmt.options(selectinload(Enquiry.category), selectinload(Enquiry.product))
        .order_by(Enquiry.created_at.desc(), Enquiry.id.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    return Page(items=[_to_admin(e) for e in rows], total=total, page=page, page_size=page_size)


@router.get("/export.csv")
def export_enquiries(
    type: EnquiryType | None = None,
    status: EnquiryStatus | None = None,
    q: str | None = Query(default=None, max_length=100),
    date_from: date | None = None,
    date_to: date | None = None,
    db: Session = Depends(get_db),
):
    stmt = _filtered(type, status, q, date_from, date_to).options(
        selectinload(Enquiry.category), selectinload(Enquiry.product)
    )
    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(["ID", "Date", "Type", "Status", "Name", "Email", "Phone", "Company", "City", "Category", "Product", "Message", "Notes"])
    for e in db.scalars(stmt.order_by(Enquiry.created_at.desc())):
        row = [
            e.id, e.created_at.strftime("%Y-%m-%d %H:%M"), e.type, e.status, e.name, e.email, e.phone or "",
            e.company or "", e.city or "", e.category.name if e.category else "", e.product.name if e.product else "",
            e.message or "", e.notes or "",
        ]
        # Neutralise spreadsheet formula injection (=, +, -, @ at the start of a cell)
        writer.writerow([f"'{v}" if isinstance(v, str) and v[:1] in ("=", "+", "-", "@") else v for v in row])
    filename = f"enquiries-{date.today().isoformat()}.csv"
    return StreamingResponse(
        iter(["﻿" + buf.getvalue()]),  # BOM so Excel reads UTF-8
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/{enquiry_id}", response_model=EnquiryAdmin)
def get_enquiry(enquiry_id: int, db: Session = Depends(get_db)):
    return _to_admin(get_or_404(db, Enquiry, enquiry_id, "Enquiry"))


@router.patch("/{enquiry_id}", response_model=EnquiryAdmin)
def update_enquiry(
    enquiry_id: int,
    payload: EnquiryUpdate,
    request: Request,
    db: Session = Depends(get_db),
    admin: AdminUser = Depends(get_current_admin),
):
    enquiry = get_or_404(db, Enquiry, enquiry_id, "Enquiry")
    changes = apply_update(enquiry, payload)
    if changes:
        audit.record(db, admin, "update", "enquiry", f"Updated enquiry from {enquiry.name}", enquiry.id, changes, request)
        db.commit()
    return _to_admin(enquiry)


@router.delete("/{enquiry_id}", status_code=204)
def delete_enquiry(
    enquiry_id: int,
    request: Request,
    db: Session = Depends(get_db),
    admin: AdminUser = Depends(get_current_admin),
):
    enquiry = get_or_404(db, Enquiry, enquiry_id, "Enquiry")
    audit.record(db, admin, "delete", "enquiry", f"Deleted enquiry from {enquiry.name}", enquiry.id, request=request)
    db.delete(enquiry)
    db.commit()
