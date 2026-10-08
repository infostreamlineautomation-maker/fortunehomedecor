from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import Category, Enquiry, Faq, Media, Product
from app.schemas.admin import DashboardOut

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


def _count(db: Session, model, *where) -> int:
    return db.scalar(select(func.count()).select_from(model).where(*where)) or 0


@router.get("", response_model=DashboardOut)
def dashboard(db: Session = Depends(get_db)):
    by_type = dict(db.execute(select(Enquiry.type, func.count()).group_by(Enquiry.type)).all())
    latest = db.scalars(select(Enquiry).order_by(Enquiry.created_at.desc()).limit(5))
    return DashboardOut(
        categories=_count(db, Category),
        products=_count(db, Product),
        faqs=_count(db, Faq),
        media=_count(db, Media),
        enquiries_total=sum(by_type.values()),
        enquiries_new=_count(db, Enquiry, Enquiry.status == "new"),
        enquiries_by_type={t: by_type.get(t, 0) for t in ("contact", "quote", "sample")},
        latest_enquiries=[
            {"id": e.id, "name": e.name, "type": e.type, "status": e.status, "created_at": e.created_at.isoformat()}
            for e in latest
        ],
    )
