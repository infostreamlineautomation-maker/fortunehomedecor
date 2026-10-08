from sqlalchemy import Boolean, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, SeoMixin, TimestampMixin


class Product(TimestampMixin, SeoMixin, Base):
    """A product type inside a category, e.g. "Sheer Curtains" in Curtains."""

    __tablename__ = "products"

    id: Mapped[int] = mapped_column(primary_key=True)
    category_id: Mapped[int] = mapped_column(ForeignKey("categories.id", ondelete="CASCADE"), index=True)
    name: Mapped[str] = mapped_column(String(160))
    slug: Mapped[str] = mapped_column(String(180), unique=True, index=True)
    short_description: Mapped[str | None] = mapped_column(String(500))
    description: Mapped[str | None] = mapped_column(Text)
    suitable_for: Mapped[list[str]] = mapped_column(JSONB, default=list)  # ["Hospitality", "Lounges"]
    cover_image: Mapped[str | None] = mapped_column(String(500))
    images: Mapped[list[str]] = mapped_column(JSONB, default=list)

    sequence: Mapped[int] = mapped_column(Integer, default=0, index=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    category: Mapped["Category"] = relationship(back_populates="products")  # noqa: F821
