import re
import unicodedata

from sqlalchemy import select
from sqlalchemy.orm import Session


def slugify(value: str) -> str:
    value = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode()
    value = re.sub(r"[^\w\s-]", "", value.lower())
    return re.sub(r"[-\s_]+", "-", value).strip("-") or "item"


def unique_slug(db: Session, model, base: str, exclude_id: int | None = None, reserved: set[str] = frozenset()) -> str:
    """Slugify `base` and append -2, -3… until it's unique for `model.slug` and not reserved."""
    root = slugify(base)
    slug, n = root, 2
    while True:
        if slug in reserved:
            slug, n = f"{root}-{n}", n + 1
            continue
        stmt = select(model.id).where(model.slug == slug)
        if exclude_id is not None:
            stmt = stmt.where(model.id != exclude_id)
        if db.scalar(stmt) is None:
            return slug
        slug, n = f"{root}-{n}", n + 1
