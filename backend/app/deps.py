import jwt
from fastapi import Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import decode_access_token
from app.models import AdminUser

AUTH_COOKIE = "fd_admin_token"


def get_current_admin(request: Request, db: Session = Depends(get_db)) -> AdminUser:
    unauthorized = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    token = None
    header = request.headers.get("Authorization", "")
    if header.startswith("Bearer "):
        token = header.removeprefix("Bearer ")
    if not token:
        token = request.cookies.get(AUTH_COOKIE)
    if not token:
        raise unauthorized

    try:
        admin_id = int(decode_access_token(token)["sub"])
    except (jwt.PyJWTError, KeyError, ValueError):
        raise unauthorized from None

    admin = db.get(AdminUser, admin_id)
    if admin is None or not admin.is_active:
        raise unauthorized
    return admin


def require_superadmin(admin: AdminUser = Depends(get_current_admin)) -> AdminUser:
    if admin.role != "superadmin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Superadmin access required")
    return admin
