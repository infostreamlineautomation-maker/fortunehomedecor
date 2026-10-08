"""Load the Figma content into the database.

    python -m app.seed                   # create anything missing; never overwrites CMS edits
    python -m app.seed --reset-content   # overwrite settings, page sections and seeded rows with seed values

Safe to run on every deploy.
"""
import argparse
import mimetypes

from PIL import Image
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import SessionLocal
from app.models import Category, Faq, Media, PageSection, Product, SiteSetting
from app.seed_data import CATEGORIES, CATEGORY_FAQS, FAQS, MEDIA_ALT, PAGES, SETTINGS


def _upsert(obj, values: dict, reset: bool) -> bool:
    """Apply values to an existing row only when resetting. Returns True if anything was written."""
    if obj is None or not reset:
        return False
    for k, v in values.items():
        setattr(obj, k, v)
    return True


def seed_settings(db: Session, reset: bool) -> int:
    n = 0
    for key, value in SETTINGS.items():
        row = db.get(SiteSetting, key)
        if row is None:
            db.add(SiteSetting(key=key, value=value))
            n += 1
        elif reset:
            row.value = value
            n += 1
    return n


def seed_pages(db: Session, reset: bool) -> int:
    n = 0
    for page, sections in PAGES.items():
        for seq, (key, label, content) in enumerate(sections):
            row = db.scalar(select(PageSection).where(PageSection.page == page, PageSection.key == key))
            values = {"label": label, "content": content, "sequence": seq}
            if row is None:
                db.add(PageSection(page=page, key=key, **values))
                n += 1
            elif _upsert(row, values, reset):
                n += 1
    return n


def seed_catalogue(db: Session, reset: bool) -> int:
    n = 0
    for seq, data in enumerate(CATEGORIES):
        data = dict(data)
        products = data.pop("products")
        category = db.scalar(select(Category).where(Category.slug == data["slug"]))
        if category is None:
            category = Category(**data, sequence=seq)
            db.add(category)
            db.flush()
            n += 1
        elif _upsert(category, data, reset):
            n += 1

        for pseq, pdata in enumerate(products):
            product = db.scalar(select(Product).where(Product.slug == pdata["slug"]))
            if product is None:
                db.add(Product(**pdata, category_id=category.id, sequence=pseq))
                n += 1
            elif _upsert(product, pdata, reset):
                n += 1
    return n


def seed_faqs(db: Session) -> int:
    """FAQs are only seeded into an empty scope, so deleted/edited FAQs aren't recreated."""
    n = 0
    scopes = {None: FAQS} | {
        db.scalar(select(Category.id).where(Category.slug == slug)): items for slug, items in CATEGORY_FAQS.items()
    }
    for category_id, items in scopes.items():
        scope = Faq.category_id.is_(None) if category_id is None else Faq.category_id == category_id
        if db.scalar(select(Faq.id).where(scope).limit(1)):
            continue
        for seq, (question, answer) in enumerate(items):
            db.add(Faq(question=question, answer=answer, category_id=category_id, sequence=seq))
            n += 1
    return n


def seed_media(db: Session) -> int:
    """Register every file under uploads/figma in the media library."""
    n = 0
    root = settings.upload_path
    for path in sorted((root / "figma").rglob("*")):
        if not path.is_file():
            continue
        url = "/uploads/" + path.relative_to(root).as_posix()
        if db.scalar(select(Media.id).where(Media.url == url)):
            continue
        with Image.open(path) as im:
            width, height = im.size
        rel = path.relative_to(root / "figma").as_posix()
        db.add(
            Media(
                url=url,
                filename=path.name,
                mime_type=mimetypes.guess_type(path.name)[0] or "application/octet-stream",
                size_bytes=path.stat().st_size,
                width=width,
                height=height,
                alt_text=MEDIA_ALT.get(rel, ""),
                folder="figma",
            )
        )
        n += 1
    return n


def run(reset: bool = False) -> dict[str, int]:
    with SessionLocal() as db:
        counts = {
            "settings": seed_settings(db, reset),
            "pages": seed_pages(db, reset),
            "catalogue": seed_catalogue(db, reset),
            "faqs": seed_faqs(db),
            "media": seed_media(db),
        }
        db.commit()
    return counts


def main() -> None:
    parser = argparse.ArgumentParser(prog="python -m app.seed")
    parser.add_argument("--reset-content", action="store_true", help="Overwrite seeded content with the seed values")
    args = parser.parse_args()
    counts = run(reset=args.reset_content)
    print("Seed complete:", ", ".join(f"{k}={v}" for k, v in counts.items()))


if __name__ == "__main__":
    main()
