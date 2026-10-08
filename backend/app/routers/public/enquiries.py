import logging

from fastapi import APIRouter, BackgroundTasks, Depends, Request
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.limiter import limiter
from app.models import Category, Enquiry, Product
from app.schemas.enquiry import EnquiryAccepted, EnquiryCreate
from app.services.audit import client_ip
from app.services.mailer import notify_recipients, send_email

router = APIRouter(tags=["enquiries"])
log = logging.getLogger(__name__)

TYPE_LABELS = {"contact": "Contact enquiry", "quote": "Quote request", "sample": "Sample request"}


def _notification_text(e: Enquiry) -> str:
    lines = [
        f"New {TYPE_LABELS[e.type].lower()} from the website.",
        "",
        f"Name:     {e.name}",
        f"Email:    {e.email}",
        f"Phone:    {e.phone or '-'}",
        f"Company:  {e.company or '-'}",
        f"City:     {e.city or '-'}",
    ]
    if e.category:
        lines.append(f"Category: {e.category.name}")
    if e.product:
        lines.append(f"Product:  {e.product.name}")
    lines += ["", "Message:", e.message or "-", "", f"Sent from: {e.source_page or '-'}"]
    lines += [f"Open in CMS: {settings.CMS_URL.rstrip('/')}/enquiries/{e.id}"]
    return "\n".join(lines)


def _notify(enquiry_id: int) -> None:
    from app.core.database import SessionLocal

    with SessionLocal() as db:
        e = db.get(Enquiry, enquiry_id)
        if e is None:
            return
        subject = f"{TYPE_LABELS[e.type]}: {e.name}"
        send_email(notify_recipients(), subject, _notification_text(e), reply_to=e.email)


@router.post("/enquiries", response_model=EnquiryAccepted, status_code=201)
@limiter.limit("5/minute;30/day")
def create_enquiry(
    request: Request,
    payload: EnquiryCreate,
    background: BackgroundTasks,
    db: Session = Depends(get_db),
):
    if payload.website:
        # Honeypot filled: pretend success so bots learn nothing
        log.info("Dropped enquiry from %s (honeypot)", client_ip(request))
        return EnquiryAccepted()

    category = product = None
    if payload.product_slug:
        product = db.scalar(select(Product).where(Product.slug == payload.product_slug))
        category = product.category if product else None
    if category is None and payload.category_slug:
        category = db.scalar(select(Category).where(Category.slug == payload.category_slug))

    enquiry = Enquiry(
        type=payload.type,
        name=payload.name.strip(),
        email=payload.email.lower(),
        phone=payload.phone,
        company=payload.company,
        city=payload.city,
        message=payload.message,
        category_id=category.id if category else None,
        product_id=product.id if product else None,
        source_page=payload.source_page,
        ip_address=client_ip(request),
        user_agent=(request.headers.get("user-agent") or "")[:300],
    )
    db.add(enquiry)
    db.commit()

    background.add_task(_notify, enquiry.id)
    return EnquiryAccepted()
