from typing import Annotated, Generic, TypeVar

from pydantic import AfterValidator, BaseModel, Field

T = TypeVar("T")


def _check_media_path(value: str | None) -> str | None:
    if value in (None, ""):
        return None
    if not value.startswith("/uploads/") or ".." in value or "\\" in value or any(c.isspace() for c in value):
        raise ValueError("must be a media path starting with /uploads/ (pick it from the Media Library)")
    return value


# Image fields store paths into backend/uploads, never arbitrary URLs
MediaPath = Annotated[str | None, AfterValidator(_check_media_path)]
MediaPathList = list[Annotated[str, AfterValidator(_check_media_path)]]

Slug = Annotated[str, Field(min_length=1, max_length=180, pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$")]

# Used as fixed website routes under /products/<category>/, so products can't take them
RESERVED_PRODUCT_SLUGS = {"types"}


class Page(BaseModel, Generic[T]):
    items: list[T]
    total: int
    page: int
    page_size: int


class ReorderIn(BaseModel):
    ids: list[int] = Field(min_length=1, description="IDs in their new display order")


class SeoFields(BaseModel):
    meta_title: str | None = Field(default=None, max_length=160)
    meta_description: str | None = Field(default=None, max_length=320)
    og_image: MediaPath = None
