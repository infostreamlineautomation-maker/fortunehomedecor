from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.limiter import limiter
from app.core.security import create_access_token, hash_password, verify_password
from app.deps import AUTH_COOKIE, get_current_admin
from app.models import AdminUser
from app.schemas.admin import PasswordChange, ProfileUpdate
from app.schemas.auth import AdminUserOut, LoginRequest, TokenResponse
from app.services import audit

router = APIRouter(prefix="/auth", tags=["admin-auth"])

# Compared against when the email is unknown, so response time doesn't reveal which emails exist
_DUMMY_HASH = hash_password("timing-equaliser")


@router.post("/login", response_model=TokenResponse)
@limiter.limit("10/minute")
def login(request: Request, payload: LoginRequest, response: Response, db: Session = Depends(get_db)):
    admin = db.scalar(select(AdminUser).where(AdminUser.email == payload.email.strip().lower()))
    password_ok = verify_password(payload.password, admin.password_hash if admin else _DUMMY_HASH)
    if admin is None or not admin.is_active or not password_ok:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    admin.last_login_at = datetime.now(timezone.utc)
    audit.record(db, admin, "login", "auth", f"{admin.email} signed in", admin.id, request=request)
    db.commit()

    token = create_access_token(admin.id)
    cookie_samesite = "none" if settings.is_production else "lax"
    cookie_secure = True if settings.is_production else False

    response.set_cookie(
        AUTH_COOKIE,
        token,
        httponly=True,
        secure=cookie_secure,
        samesite=cookie_samesite,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )
    return TokenResponse(access_token=token)


@router.post("/logout")
def logout(response: Response):
    cookie_samesite = "none" if settings.is_production else "lax"
    cookie_secure = True if settings.is_production else False
    response.delete_cookie(
        AUTH_COOKIE,
        httponly=True,
        secure=cookie_secure,
        samesite=cookie_samesite,
    )
    return {"ok": True}


@router.get("/me", response_model=AdminUserOut)
def me(admin: AdminUser = Depends(get_current_admin)):
    return admin


@router.patch("/me", response_model=AdminUserOut)
def update_profile(payload: ProfileUpdate, db: Session = Depends(get_db), admin: AdminUser = Depends(get_current_admin)):
    admin.full_name = payload.full_name.strip()
    db.commit()
    return admin


@router.post("/password", status_code=204)
@limiter.limit("5/minute")
def change_password(
    request: Request,
    payload: PasswordChange,
    db: Session = Depends(get_db),
    admin: AdminUser = Depends(get_current_admin),
):
    if not verify_password(payload.current_password, admin.password_hash):
        raise HTTPException(400, "Current password is incorrect")
    admin.password_hash = hash_password(payload.new_password)
    audit.record(db, admin, "update", "auth", f"{admin.email} changed their password", admin.id, request=request)
    db.commit()
