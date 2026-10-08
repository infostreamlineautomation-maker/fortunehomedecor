from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, Request, UploadFile
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.deps import get_current_admin
from app.models import AdminUser, Media
from app.routers.admin._helpers import apply_update, get_or_404
from app.schemas.admin import MediaOut, MediaUpdate
from app.schemas.common import Page
from app.services import audit
from app.services.media import delete_file, find_usage, store_image

router = APIRouter(prefix="/media", tags=["media"])


@router.get("", response_model=Page[MediaOut])
def list_media(
    q: str | None = Query(default=None, max_length=100),
    folder: str | None = None,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=48, ge=1, le=200),
    db: Session = Depends(get_db),
):
    stmt = select(Media)
    if folder:
        stmt = stmt.where(Media.folder == folder)
    if q:
        like = f"%{q}%"
        stmt = stmt.where(or_(Media.filename.ilike(like), Media.alt_text.ilike(like), Media.url.ilike(like)))
    total = db.scalar(select(func.count()).select_from(stmt.subquery())) or 0
    items = db.scalars(stmt.order_by(Media.created_at.desc(), Media.id.desc()).offset((page - 1) * page_size).limit(page_size)).all()
    return Page(items=items, total=total, page=page, page_size=page_size)


@router.get("/folders", response_model=list[str])
def list_folders(db: Session = Depends(get_db)):
    return db.scalars(select(Media.folder).distinct().order_by(Media.folder)).all()


@router.post("", response_model=MediaOut, status_code=201)
def upload_media(
    request: Request,
    file: UploadFile = File(...),
    alt_text: str = Form(default="", max_length=300),
    db: Session = Depends(get_db),
    admin: AdminUser = Depends(get_current_admin),
):
    stored = store_image(file, folder="library")
    media = Media(
        url=stored.url,
        filename=(file.filename or "upload")[:255],
        mime_type=stored.mime_type,
        size_bytes=stored.size_bytes,
        width=stored.width,
        height=stored.height,
        alt_text=alt_text,
        folder="library",
        uploaded_by=admin.id,
    )
    try:
        db.add(media)
        db.flush()
        audit.record(db, admin, "upload", "media", f"Uploaded {media.filename}", media.id, request=request)
        db.commit()
    except Exception:
        db.rollback()
        delete_file(stored.url)  # don't leave an orphaned file behind
        raise
    return media


@router.patch("/{media_id}", response_model=MediaOut)
def update_media(
    media_id: int,
    payload: MediaUpdate,
    request: Request,
    db: Session = Depends(get_db),
    admin: AdminUser = Depends(get_current_admin),
):
    media = get_or_404(db, Media, media_id, "Media")
    changes = apply_update(media, payload)
    if changes:
        audit.record(db, admin, "update", "media", f"Updated {media.filename}", media.id, changes, request)
        db.commit()
    return media


@router.get("/{media_id}/usage", response_model=list[str])
def media_usage(media_id: int, db: Session = Depends(get_db)):
    return find_usage(db, get_or_404(db, Media, media_id, "Media").url)


@router.delete("/{media_id}", status_code=204)
def delete_media(
    media_id: int,
    request: Request,
    db: Session = Depends(get_db),
    admin: AdminUser = Depends(get_current_admin),
):
    media = get_or_404(db, Media, media_id, "Media")
    used_in = find_usage(db, media.url)
    if used_in:
        raise HTTPException(409, "This file is still used in: " + "; ".join(used_in))
    audit.record(db, admin, "delete", "media", f"Deleted {media.filename}", media.id, request=request)
    db.delete(media)
    db.commit()
    delete_file(media.url)
