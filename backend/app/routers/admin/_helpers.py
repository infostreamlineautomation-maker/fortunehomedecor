from datetime import date, datetime
from typing import Any, TypeVar

from fastapi import HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

M = TypeVar("M")


def get_or_404(db: Session, model: type[M], id_: Any, label: str | None = None) -> M:
    obj = db.get(model, id_)
    if obj is None:
        raise HTTPException(404, f"{label or model.__name__} not found")
    return obj


def _plain(value: Any) -> Any:
    return value.isoformat() if isinstance(value, (datetime, date)) else value


def apply_update(obj: Any, payload: BaseModel) -> dict[str, list[Any]]:
    """Copy fields the client actually sent onto `obj`; returns {field: [old, new]} for the audit log."""
    changes: dict[str, list[Any]] = {}
    for field, new in payload.model_dump(exclude_unset=True).items():
        old = getattr(obj, field)
        if old != new:
            changes[field] = [_plain(old), _plain(new)]
            setattr(obj, field, new)
    return changes


def reorder(db: Session, model: Any, ids: list[int], scope: Any = None) -> None:
    """Set `sequence` to the position of each id. `scope` limits which rows may be reordered."""
    stmt = select(model).where(model.id.in_(ids))
    if scope is not None:
        stmt = stmt.where(scope)
    rows = {row.id: row for row in db.scalars(stmt)}
    if len(rows) != len(set(ids)):
        raise HTTPException(400, "Unknown or out-of-scope id in reorder list")
    for position, id_ in enumerate(ids):
        rows[id_].sequence = position


def next_sequence(db: Session, model: Any, scope: Any = None) -> int:
    from sqlalchemy import func

    stmt = select(func.coalesce(func.max(model.sequence), -1))
    if scope is not None:
        stmt = stmt.where(scope)
    return db.scalar(stmt) + 1
