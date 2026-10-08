from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.deps import get_current_admin
from app.models import AdminUser, SiteSetting
from app.schemas.content import SETTING_KEYS, SettingUpdate
from app.services import audit
from app.services.audit import diff
from app.services.revalidate import revalidate_site

router = APIRouter(prefix="/settings", tags=["settings"])


@router.get("")
def get_settings(db: Session = Depends(get_db)) -> dict[str, dict]:
    stored = {s.key: s.value for s in db.scalars(select(SiteSetting))}
    return {key: stored.get(key, {}) for key in SETTING_KEYS}


@router.put("/{key}")
def update_setting(
    key: str,
    payload: SettingUpdate,
    request: Request,
    background: BackgroundTasks,
    db: Session = Depends(get_db),
    admin: AdminUser = Depends(get_current_admin),
) -> dict:
    if key not in SETTING_KEYS:
        raise HTTPException(404, f"Unknown setting '{key}'")
    setting = db.get(SiteSetting, key)
    before = dict(setting.value) if setting else {}
    if setting is None:
        setting = SiteSetting(key=key, value=payload.value)
        db.add(setting)
    else:
        setting.value = payload.value
    changes = diff(before, payload.value)
    if changes:
        audit.record(db, admin, "update", "settings", f"Updated {key} settings", key, changes, request)
    db.commit()
    background.add_task(revalidate_site, "settings")
    return setting.value


@router.post("/publish")
def publish_all(
    request: Request,
    background: BackgroundTasks,
    db: Session = Depends(get_db),
    admin: AdminUser = Depends(get_current_admin),
) -> dict:
    all_tags = [
        "settings",
        "categories",
        "search",
        "faqs",
        "page:home",
        "page:about",
        "page:contact",
        "page:products",
    ]
    audit.record(db, admin, "publish", "site", "Published live site updates", "all", None, request)
    db.commit()
    background.add_task(revalidate_site, *all_tags)
    return {"status": "published", "message": "All website content published live"}

