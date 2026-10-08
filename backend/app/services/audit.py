from typing import Any

from fastapi import Request
from sqlalchemy.orm import Session

from app.models import AdminUser, AuditLog


def client_ip(request: Request | None) -> str | None:
    if request is None:
        return None
    # Nginx sets X-Real-IP from the TCP connection (deploy/nginx). X-Forwarded-For is
    # client-controlled, so it's not trusted. The APIs bind to 127.0.0.1 behind Nginx.
    real_ip = request.headers.get("x-real-ip")
    if real_ip:
        return real_ip.strip()
    return request.client.host if request.client else None


def diff(before: dict[str, Any], after: dict[str, Any]) -> dict[str, Any]:
    """{field: [old, new]} for fields that changed."""
    return {k: [before.get(k), v] for k, v in after.items() if before.get(k) != v}


def record(
    db: Session,
    admin: AdminUser | None,
    action: str,
    entity: str,
    summary: str,
    entity_id: Any = None,
    changes: dict[str, Any] | None = None,
    request: Request | None = None,
) -> None:
    """Add an audit entry to the session; it's committed with the caller's transaction."""
    db.add(
        AuditLog(
            admin_id=admin.id if admin else None,
            action=action,
            entity=entity,
            entity_id=str(entity_id) if entity_id is not None else None,
            summary=summary[:300],
            changes=changes or None,
            ip_address=client_ip(request),
        )
    )
