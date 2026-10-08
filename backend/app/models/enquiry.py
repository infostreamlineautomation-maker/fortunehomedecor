from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin

ENQUIRY_TYPES = ("contact", "quote", "sample")
ENQUIRY_STATUSES = ("new", "in_progress", "closed")


class Enquiry(TimestampMixin, Base):
    __tablename__ = "enquiries"

    id: Mapped[int] = mapped_column(primary_key=True)
    type: Mapped[str] = mapped_column(String(20), default="contact", index=True)
    status: Mapped[str] = mapped_column(String(20), default="new", index=True)

    name: Mapped[str] = mapped_column(String(150))
    email: Mapped[str] = mapped_column(String(255))
    phone: Mapped[str | None] = mapped_column(String(40))
    company: Mapped[str | None] = mapped_column(String(150))
    city: Mapped[str | None] = mapped_column(String(120))
    message: Mapped[str | None] = mapped_column(Text)

    category_id: Mapped[int | None] = mapped_column(ForeignKey("categories.id", ondelete="SET NULL"))
    product_id: Mapped[int | None] = mapped_column(ForeignKey("products.id", ondelete="SET NULL"))

    notes: Mapped[str | None] = mapped_column(Text)  # internal, CMS only
    source_page: Mapped[str | None] = mapped_column(String(300))
    ip_address: Mapped[str | None] = mapped_column(String(64))
    user_agent: Mapped[str | None] = mapped_column(String(300))

    category: Mapped["Category | None"] = relationship()  # noqa: F821
    product: Mapped["Product | None"] = relationship()  # noqa: F821
