from sqlalchemy import Boolean, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, SeoMixin, TimestampMixin


class Category(TimestampMixin, SeoMixin, Base):
    """A collection: Curtains, Blinds, Wallpapers, Stretch Ceilings, Architectural Solutions."""

    __tablename__ = "categories"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120))
    slug: Mapped[str] = mapped_column(String(140), unique=True, index=True)
    tagline: Mapped[str | None] = mapped_column(String(255))
    description: Mapped[str | None] = mapped_column(Text)

    # Category page intro block ("Designed for Modern Projects")
    intro_title: Mapped[str | None] = mapped_column(String(200))
    intro_text: Mapped[str | None] = mapped_column(Text)
    types_heading: Mapped[str | None] = mapped_column(String(120))  # "Curtain Types"

    card_image: Mapped[str | None] = mapped_column(String(500))
    hero_image: Mapped[str | None] = mapped_column(String(500))  # beside the intro block
    types_image: Mapped[str | None] = mapped_column(String(500))  # beside the "<Category> Types" list
    gallery: Mapped[list[str]] = mapped_column(JSONB, default=list)

    sequence: Mapped[int] = mapped_column(Integer, default=0, index=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    products: Mapped[list["Product"]] = relationship(  # noqa: F821
        back_populates="category", order_by="Product.sequence", cascade="all, delete-orphan"
    )
