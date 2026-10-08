from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.core.database import get_db
from app.deps import require_superadmin
from app.models import AuditLog
from app.schemas.admin import AuditOut
from app.schemas.common import Page

router = APIRouter(prefix="/audit-logs", tags=["audit"], dependencies=[Depends(require_superadmin)])


@router.get("", response_model=Page[AuditOut])
def list_audit_logs(
    entity: str | None = None,
    admin_id: int | None = None,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    stmt = select(AuditLog)
    if entity:
        stmt = stmt.where(AuditLog.entity == entity)
    if admin_id:
        stmt = stmt.where(AuditLog.admin_id == admin_id)
    total = db.scalar(select(func.count()).select_from(stmt.subquery())) or 0
    rows = db.scalars(
        stmt.options(selectinload(AuditLog.admin))
        .order_by(AuditLog.created_at.desc(), AuditLog.id.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    items = []
    for log in rows:
        out = AuditOut.model_validate(log)
        out.admin_email = log.admin.email if log.admin else None
        items.append(out)
    return Page(items=items, total=total, page=page, page_size=page_size)
