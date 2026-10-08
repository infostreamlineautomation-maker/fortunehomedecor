"""Schemas for CMS-only resources: media, users, audit log, dashboard."""
from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field

ORM = ConfigDict(from_attributes=True)


class MediaOut(BaseModel):
    model_config = ORM
    id: int
    url: str
    filename: str
    mime_type: str
    size_bytes: int
    width: int | None
    height: int | None
    alt_text: str
    folder: str
    created_at: datetime


class MediaUpdate(BaseModel):
    alt_text: str | None = Field(default=None, max_length=300)
    folder: str | None = Field(default=None, min_length=1, max_length=80, pattern=r"^[a-z0-9_-]+$")


Role = Literal["superadmin", "editor"]


class UserCreate(BaseModel):
    email: EmailStr
    full_name: str = Field(default="", max_length=150)
    password: str = Field(min_length=8, max_length=128)
    role: Role = "editor"


class UserUpdate(BaseModel):
    full_name: str | None = Field(default=None, max_length=150)
    role: Role | None = None
    is_active: bool | None = None
    password: str | None = Field(default=None, min_length=8, max_length=128)


class UserOut(BaseModel):
    model_config = ORM
    id: int
    email: str
    full_name: str
    role: str
    is_active: bool
    last_login_at: datetime | None
    created_at: datetime


class PasswordChange(BaseModel):
    current_password: str
    new_password: str = Field(min_length=8, max_length=128)


class ProfileUpdate(BaseModel):
    full_name: str = Field(max_length=150)


class AuditOut(BaseModel):
    model_config = ORM
    id: int
    admin_id: int | None
    admin_email: str | None = None
    action: str
    entity: str
    entity_id: str | None
    summary: str
    changes: dict[str, Any] | None
    ip_address: str | None
    created_at: datetime


class DashboardOut(BaseModel):
    categories: int
    products: int
    faqs: int
    media: int
    enquiries_total: int
    enquiries_new: int
    enquiries_by_type: dict[str, int]
    latest_enquiries: list[dict[str, Any]]
