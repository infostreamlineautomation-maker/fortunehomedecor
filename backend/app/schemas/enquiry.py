from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field

EnquiryType = Literal["contact", "quote", "sample"]
EnquiryStatus = Literal["new", "in_progress", "closed"]


class EnquiryCreate(BaseModel):
    type: EnquiryType = "contact"
    name: str = Field(min_length=2, max_length=150)
    email: EmailStr
    phone: str | None = Field(default=None, max_length=40, pattern=r"^[0-9+()\-.\s]*$")
    company: str | None = Field(default=None, max_length=150)
    city: str | None = Field(default=None, max_length=120)
    message: str | None = Field(default=None, max_length=5000)
    category_slug: str | None = Field(default=None, max_length=140)
    product_slug: str | None = Field(default=None, max_length=180)
    source_page: str | None = Field(default=None, max_length=300)
    # Honeypot: hidden on the website form; bots that fill it are silently dropped
    website: str | None = Field(default=None, max_length=200)


class EnquiryAccepted(BaseModel):
    ok: bool = True
    message: str = "Thank you! We'll get back to you within 24 hours."


class EnquiryAdmin(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    type: str
    status: str
    name: str
    email: str
    phone: str | None
    company: str | None
    city: str | None
    message: str | None
    category_id: int | None
    product_id: int | None
    category_name: str | None = None
    product_name: str | None = None
    notes: str | None
    source_page: str | None
    ip_address: str | None
    created_at: datetime
    updated_at: datetime


class EnquiryUpdate(BaseModel):
    status: EnquiryStatus | None = None
    notes: str | None = Field(default=None, max_length=5000)
