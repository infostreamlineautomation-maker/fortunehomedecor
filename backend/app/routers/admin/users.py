from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import hash_password
from app.deps import require_superadmin
from app.models import AdminUser
from app.routers.admin._helpers import get_or_404
from app.schemas.admin import UserCreate, UserOut, UserUpdate
from app.services import audit

router = APIRouter(prefix="/users", tags=["users"], dependencies=[Depends(require_superadmin)])


def _active_superadmins(db: Session) -> int:
    return db.scalar(select(func.count()).where(AdminUser.role == "superadmin", AdminUser.is_active)) or 0


@router.get("", response_model=list[UserOut])
def list_users(db: Session = Depends(get_db)):
    return db.scalars(select(AdminUser).order_by(AdminUser.created_at)).all()


@router.post("", response_model=UserOut, status_code=201)
def create_user(
    payload: UserCreate,
    request: Request,
    db: Session = Depends(get_db),
    admin: AdminUser = Depends(require_superadmin),
):
    email = payload.email.lower()
    if db.scalar(select(AdminUser.id).where(AdminUser.email == email)):
        raise HTTPException(409, "A user with this email already exists")
    user = AdminUser(email=email, full_name=payload.full_name, role=payload.role, password_hash=hash_password(payload.password))
    db.add(user)
    db.flush()
    audit.record(db, admin, "create", "user", f"Created {payload.role} {email}", user.id, request=request)
    db.commit()
    return user


@router.patch("/{user_id}", response_model=UserOut)
def update_user(
    user_id: int,
    payload: UserUpdate,
    request: Request,
    db: Session = Depends(get_db),
    admin: AdminUser = Depends(require_superadmin),
):
    user = get_or_404(db, AdminUser, user_id, "User")
    data = payload.model_dump(exclude_unset=True)

    losing_superadmin = user.role == "superadmin" and user.is_active and (
        data.get("role", "superadmin") != "superadmin" or data.get("is_active") is False
    )
    if losing_superadmin and _active_superadmins(db) <= 1:
        raise HTTPException(400, "There must be at least one active superadmin")

    changes: dict = {}
    if "password" in data:
        if data.pop("password"):
            user.password_hash = hash_password(payload.password)
            changes["password"] = "reset"
    for field, value in data.items():
        if getattr(user, field) != value:
            changes[field] = [getattr(user, field), value]
            setattr(user, field, value)
    if changes:
        audit.record(db, admin, "update", "user", f"Updated user {user.email}", user.id, changes, request)
        db.commit()
    return user


@router.delete("/{user_id}", status_code=204)
def delete_user(
    user_id: int,
    request: Request,
    db: Session = Depends(get_db),
    admin: AdminUser = Depends(require_superadmin),
):
    user = get_or_404(db, AdminUser, user_id, "User")
    if user.id == admin.id:
        raise HTTPException(400, "You can't delete your own account")
    if user.role == "superadmin" and user.is_active and _active_superadmins(db) <= 1:
        raise HTTPException(400, "There must be at least one active superadmin")
    audit.record(db, admin, "delete", "user", f"Deleted user {user.email}", user.id, request=request)
    db.delete(user)
    db.commit()
