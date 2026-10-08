from datetime import datetime

from sqlalchemy import DateTime, String, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class SeoMixin:
    meta_title: Mapped[str | None] = mapped_column(String(160))
    meta_description: Mapped[str | None] = mapped_column(String(320))
    og_image: Mapped[str | None] = mapped_column(String(500))
