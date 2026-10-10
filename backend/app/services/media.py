import io
import uuid
import warnings
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path

from fastapi import HTTPException, UploadFile, status
from PIL import Image, ImageOps
from sqlalchemy import String, cast, or_, select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models import Category, PageSection, Product, SiteSetting

# Format reported by Pillow -> (extension, mime type)
ALLOWED_FORMATS = {
    "JPEG": (".jpg", "image/jpeg"),
    "PNG": (".png", "image/png"),
    "WEBP": (".webp", "image/webp"),
    "GIF": (".gif", "image/gif"),
}

ALLOWED_VIDEO_FORMATS = {
    "video/mp4": ".mp4",
    "video/webm": ".webm",
    "video/ogg": ".ogv",
    "video/quicktime": ".mov",
}

VIDEO_EXTENSIONS = {
    ".mp4": "video/mp4",
    ".webm": "video/webm",
    ".ogv": "video/ogg",
    ".mov": "video/quicktime",
}

MAX_PIXELS = 50_000_000  # ~7000x7000; rejects decompression bombs

Image.MAX_IMAGE_PIXELS = MAX_PIXELS


@dataclass
class StoredFile:
    url: str
    mime_type: str
    size_bytes: int
    width: int
    height: int


def _read_limited(upload: UploadFile) -> bytes:
    limit = settings.MAX_UPLOAD_MB * 1024 * 1024
    data = upload.file.read(limit + 1)
    if len(data) > limit:
        raise HTTPException(status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, f"File is larger than {settings.MAX_UPLOAD_MB} MB")
    if not data:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Empty file")
    return data


def _upload_to_cloudinary(raw: bytes, filename: str, is_video: bool) -> StoredFile:
    try:
        import cloudinary
        import cloudinary.uploader
    except ImportError:
        raise HTTPException(
            status.HTTP_500_INTERNAL_SERVER_ERROR,
            "Cloudinary package not installed. Add 'cloudinary' to your Python environment.",
        )

    cloudinary.config(
        cloud_name=settings.CLOUDINARY_CLOUD_NAME,
        api_key=settings.CLOUDINARY_API_KEY,
        api_secret=settings.CLOUDINARY_API_SECRET,
        secure=True,
    )

    resource_type = "video" if is_video else "image"
    try:
        res = cloudinary.uploader.upload(
            raw,
            folder=settings.CLOUDINARY_FOLDER,
            resource_type=resource_type,
            use_filename=True,
            unique_filename=True,
        )
    except Exception as exc:
        raise HTTPException(
            status.HTTP_502_BAD_GATEWAY,
            f"Failed to upload media to Cloudinary: {exc}",
        ) from exc

    url = res.get("secure_url") or res.get("url") or ""
    mime = res.get("format") or ("video/mp4" if is_video else "image/jpeg")
    if not mime.startswith(("image/", "video/")):
        mime = f"{resource_type}/{mime}"

    return StoredFile(
        url=url,
        mime_type=mime,
        size_bytes=int(res.get("bytes") or len(raw)),
        width=int(res.get("width") or 0),
        height=int(res.get("height") or 0),
    )


def store_image(upload: UploadFile, folder: str = "library") -> StoredFile:
    """Validate an uploaded image or video, optimize/strip metadata and save it."""
    raw = _read_limited(upload)
    content_type = (upload.content_type or "").lower()
    filename = (upload.filename or "").lower()
    file_ext = Path(filename).suffix.lower()

    # Check if video
    is_video = content_type in ALLOWED_VIDEO_FORMATS or file_ext in VIDEO_EXTENSIONS
    if is_video:
        if settings.use_cloudinary:
            return _upload_to_cloudinary(raw, filename, is_video=True)

        ext = file_ext if file_ext in VIDEO_EXTENSIONS else ALLOWED_VIDEO_FORMATS.get(content_type, ".mp4")
        mime = content_type if content_type in ALLOWED_VIDEO_FORMATS else VIDEO_EXTENSIONS.get(file_ext, "video/mp4")
        now = datetime.now(timezone.utc)
        rel = Path(folder) / f"{now:%Y}" / f"{now:%m}" / f"{uuid.uuid4().hex}{ext}"
        dest = settings.upload_path / rel
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_bytes(raw)
        return StoredFile(
            url="/uploads/" + rel.as_posix(),
            mime_type=mime,
            size_bytes=len(raw),
            width=0,
            height=0,
        )

    # Process image
    try:
        with warnings.catch_warnings():
            warnings.simplefilter("error", Image.DecompressionBombWarning)
            with Image.open(io.BytesIO(raw)) as probe:
                probe.verify()
            img = Image.open(io.BytesIO(raw))
            img.load()
    except (Image.DecompressionBombError, Image.DecompressionBombWarning):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Image dimensions are too large") from None
    except Exception:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "File is not a valid image or video") from None

    fmt = img.format or ""
    if fmt not in ALLOWED_FORMATS:
        raise HTTPException(status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, "Use a JPG, PNG, WebP, GIF image or MP4/WebM video")
    ext, mime = ALLOWED_FORMATS[fmt]

    if fmt == "GIF":
        # Re-encoding would drop animation frames; the content was verified above
        out = raw
    else:
        img = ImageOps.exif_transpose(img)  # apply camera rotation, then drop EXIF/GPS
        buf = io.BytesIO()
        if fmt == "JPEG":
            img.convert("RGB").save(buf, "JPEG", quality=88, optimize=True, progressive=True)
        elif fmt == "PNG":
            img.save(buf, "PNG", optimize=True)
        else:
            img.save(buf, "WEBP", quality=88)
        out = buf.getvalue()

    if settings.use_cloudinary:
        return _upload_to_cloudinary(out, filename, is_video=False)

    now = datetime.now(timezone.utc)
    rel = Path(folder) / f"{now:%Y}" / f"{now:%m}" / f"{uuid.uuid4().hex}{ext}"
    dest = settings.upload_path / rel
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_bytes(out)

    return StoredFile(
        url="/uploads/" + rel.as_posix(),
        mime_type=mime,
        size_bytes=len(out),
        width=img.width,
        height=img.height,
    )


def delete_file(url: str) -> None:
    """Remove a stored file from local disk or Cloudinary; ignores invalid paths."""
    if url.startswith("https://res.cloudinary.com/") or "cloudinary.com" in url:
        if settings.use_cloudinary:
            try:
                import cloudinary
                import cloudinary.uploader

                cloudinary.config(
                    cloud_name=settings.CLOUDINARY_CLOUD_NAME,
                    api_key=settings.CLOUDINARY_API_KEY,
                    api_secret=settings.CLOUDINARY_API_SECRET,
                    secure=True,
                )
                parts = url.split("/upload/")
                if len(parts) > 1:
                    path_part = parts[1]
                    if path_part.startswith("v") and "/" in path_part:
                        path_part = path_part.split("/", 1)[1]
                    public_id = path_part.rsplit(".", 1)[0]
                    is_video = any(url.lower().endswith(ext) for ext in VIDEO_EXTENSIONS)
                    cloudinary.uploader.destroy(public_id, resource_type="video" if is_video else "image")
            except Exception:
                pass
        return

    if not url.startswith("/uploads/"):
        return
    root = settings.upload_path.resolve()
    path = (root / url.removeprefix("/uploads/")).resolve()
    if root in path.parents and path.is_file():
        path.unlink()


def find_usage(db: Session, url: str) -> list[str]:
    """Human-readable list of places that reference `url` (blocks deleting media that's in use)."""
    pattern = f"%{url}%"
    used: list[str] = []

    for c in db.scalars(
        select(Category).where(
            or_(
                Category.card_image == url,
                Category.hero_image == url,
                Category.og_image == url,
                cast(Category.gallery, String).like(pattern),
            )
        )
    ):
        used.append(f"Category: {c.name}")
    for p in db.scalars(
        select(Product).where(
            or_(Product.cover_image == url, Product.og_image == url, cast(Product.images, String).like(pattern))
        )
    ):
        used.append(f"Product: {p.name}")
    for s in db.scalars(select(PageSection).where(cast(PageSection.content, String).like(pattern))):
        used.append(f"Page: {s.page} / {s.label}")
    for st in db.scalars(select(SiteSetting).where(cast(SiteSetting.value, String).like(pattern))):
        used.append(f"Settings: {st.key}")
    return used
