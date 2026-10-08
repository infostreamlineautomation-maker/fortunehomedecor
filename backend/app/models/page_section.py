from typing import Any

from sqlalchemy import Boolean, Integer, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin


class PageSection(TimestampMixin, Base):
    """An editable block of a static page, e.g. page="home", key="why_choose_us".

    `content` is free-form JSON whose shape depends on the section (see app/seed_data.py).
    """

    __tablename__ = "page_sections"
    __table_args__ = (UniqueConstraint("page", "key", name="uq_page_sections_page_key"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    page: Mapped[str] = mapped_column(String(50), index=True)
    key: Mapped[str] = mapped_column(String(80))
    label: Mapped[str] = mapped_column(String(120))  # Human name shown in the CMS
    content: Mapped[dict[str, Any]] = mapped_column(JSONB, default=dict)
    sequence: Mapped[int] = mapped_column(Integer, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
