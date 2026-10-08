"""Schemas for categories, products, FAQs, page sections and settings (public + admin)."""
import json
from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.schemas.common import MediaPath, MediaPathList, SeoFields, Slug

ORM = ConfigDict(from_attributes=True)

# ---------------------------------------------------------------- public


class FaqOut(BaseModel):
    model_config = ORM
    id: int
    question: str
    answer: str


class CategoryCard(BaseModel):
    model_config = ORM
    id: int
    name: str
    slug: str
    tagline: str | None
    card_image: str | None


class ProductOut(SeoFields):
    model_config = ORM
    id: int
    name: str
    slug: str
    short_description: str | None
    description: str | None
    suitable_for: list[str]
    cover_image: str | None
    images: list[str]


class CategoryDetail(CategoryCard, SeoFields):
    description: str | None
    intro_title: str | None
    intro_text: str | None
    types_heading: str | None
    hero_image: str | None
    types_image: str | None
    gallery: list[str]
    products: list[ProductOut] = []
    faqs: list[FaqOut] = []


class ProductDetail(ProductOut):
    category: CategoryCard


class PageOut(BaseModel):
    page: str
    sections: dict[str, dict[str, Any]]


class SearchResult(BaseModel):
    kind: str
    title: str
    url: str
    snippet: str
    score: float


# ---------------------------------------------------------------- admin: categories


class CategoryBase(SeoFields):
    tagline: str | None = Field(default=None, max_length=255)
    description: str | None = None
    intro_title: str | None = Field(default=None, max_length=200)
    intro_text: str | None = None
    types_heading: str | None = Field(default=None, max_length=120)
    card_image: MediaPath = None
    hero_image: MediaPath = None
    types_image: MediaPath = None
    gallery: MediaPathList = []
    is_active: bool = True


class CategoryCreate(CategoryBase):
    name: str = Field(min_length=1, max_length=120)
    slug: Slug | None = None  # generated from name when omitted


class CategoryUpdate(CategoryBase):
    # All optional; only sent fields are applied (exclude_unset)
    name: str | None = Field(default=None, min_length=1, max_length=120)
    slug: Slug | None = None
    gallery: MediaPathList | None = None
    is_active: bool | None = None


class CategoryAdmin(CategoryBase):
    model_config = ORM
    id: int
    name: str
    slug: str
    sequence: int
    product_count: int = 0
    created_at: datetime
    updated_at: datetime


# ---------------------------------------------------------------- admin: products


class ProductBase(SeoFields):
    short_description: str | None = Field(default=None, max_length=500)
    description: str | None = None
    suitable_for: list[str] = []
    cover_image: MediaPath = None
    images: MediaPathList = []
    is_active: bool = True

    @field_validator("suitable_for")
    @classmethod
    def _clean_tags(cls, v: list[str] | None) -> list[str] | None:
        if v is None:
            return v
        return [t.strip()[:60] for t in v if t and t.strip()][:20]


class ProductCreate(ProductBase):
    category_id: int
    name: str = Field(min_length=1, max_length=160)
    slug: Slug | None = None


class ProductUpdate(ProductBase):
    category_id: int | None = None
    name: str | None = Field(default=None, min_length=1, max_length=160)
    slug: Slug | None = None
    suitable_for: list[str] | None = None
    images: MediaPathList | None = None
    is_active: bool | None = None


class ProductAdmin(ProductBase):
    model_config = ORM
    id: int
    category_id: int
    category_name: str = ""
    name: str
    slug: str
    sequence: int
    created_at: datetime
    updated_at: datetime


# ---------------------------------------------------------------- admin: FAQs


class FaqCreate(BaseModel):
    question: str = Field(min_length=3, max_length=300)
    answer: str = Field(min_length=1)
    category_id: int | None = None  # None = global FAQ
    is_active: bool = True


class FaqUpdate(BaseModel):
    question: str | None = Field(default=None, min_length=3, max_length=300)
    answer: str | None = Field(default=None, min_length=1)
    category_id: int | None = None
    is_active: bool | None = None


class FaqAdmin(BaseModel):
    model_config = ORM
    id: int
    question: str
    answer: str
    category_id: int | None
    sequence: int
    is_active: bool
    updated_at: datetime


# ---------------------------------------------------------------- admin: pages & settings

MAX_JSON_BYTES = 200_000


def _limit_json(value: dict[str, Any]) -> dict[str, Any]:
    if len(json.dumps(value)) > MAX_JSON_BYTES:
        raise ValueError("content is too large")
    return value


class PageSectionAdmin(BaseModel):
    model_config = ORM
    id: int
    page: str
    key: str
    label: str
    content: dict[str, Any]
    sequence: int
    is_active: bool
    updated_at: datetime


class PageSectionUpdate(BaseModel):
    label: str | None = Field(default=None, min_length=1, max_length=120)
    content: dict[str, Any] | None = None
    is_active: bool | None = None

    @field_validator("content")
    @classmethod
    def _content_size(cls, v: dict[str, Any] | None) -> dict[str, Any] | None:
        return v if v is None else _limit_json(v)


SETTING_KEYS = ("brand", "contact", "socials", "footer", "seo")


class SettingUpdate(BaseModel):
    value: dict[str, Any]

    @field_validator("value")
    @classmethod
    def _value_size(cls, v: dict[str, Any]) -> dict[str, Any]:
        return _limit_json(v)
