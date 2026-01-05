from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.user import User
from app.services.achievements import list_all_achievements, list_user_achievements


router = APIRouter(prefix="/achievements", tags=["Achievements"])


def _guard_user(user_id: UUID, x_user_id: str, db: Session) -> None:
    if not x_user_id or x_user_id != str(user_id):
        raise HTTPException(status_code=401, detail="Unauthorized")
    u = db.query(User).filter(User.id == str(user_id)).first()
    if not u:
        raise HTTPException(status_code=404, detail="User not found")


@router.get("", response_model=dict)
def get_achievement_catalog(db: Session = Depends(get_db)):
    """List all achievement definitions."""
    return {"achievements": list_all_achievements(db)}


@router.get("/me", response_model=dict)
def get_my_achievements(
    user_id: UUID,
    db: Session = Depends(get_db),
    x_user_id: str = Header(..., alias="X-User-Id"),
):
    """List achievements unlocked by the current user."""
    _guard_user(user_id, x_user_id, db)
    return {"achievements": list_user_achievements(db, user_id)}
