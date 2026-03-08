from __future__ import annotations

import os
from datetime import datetime, timedelta, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, Header, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.user import User, LoginHistory


router = APIRouter(prefix="/admin", tags=["admin"])


def _admin_emails() -> set[str]:
    """Comma/space separated ADMIN_EMAILS (submission-safe)."""
    raw = (os.getenv("ADMIN_EMAILS") or "Haytam007@gmail.com").strip()
    if not raw:
        return set()
    parts = [p.strip().lower() for p in raw.replace(";", ",").replace(" ", ",").split(",")]
    return {p for p in parts if p}


def require_global_admin(
    x_user_id: str = Header(..., alias="X-User-Id"),
    db: Session = Depends(get_db),
) -> User:
    """Simple admin guard using env-configured emails.

    - Header-based identity (matches rest of backend)
    - ADMIN_EMAILS="a@b.com,c@d.com" enables those accounts.
    """

    try:
        user_uuid = UUID(x_user_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid X-User-Id")

    user = db.query(User).filter(User.id == user_uuid).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid user")

    allowed = _admin_emails()
    if not allowed or (user.email or "").lower() not in allowed:
        raise HTTPException(status_code=403, detail="Admin access required")

    return user


@router.get("/users")
def list_users(
    limit: int = Query(200, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    _: User = Depends(require_global_admin),
    db: Session = Depends(get_db),
):
    """List users with last sign-in time (max login_history.login_time)."""

    last_login_subq = (
        db.query(
            LoginHistory.user_id.label("user_id"),
            func.max(LoginHistory.login_time).label("last_login"),
        )
        .group_by(LoginHistory.user_id)
        .subquery()
    )

    rows = (
        db.query(User, last_login_subq.c.last_login)
        .outerjoin(last_login_subq, last_login_subq.c.user_id == User.id)
        .order_by(User.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )

    out = []
    for u, last_login in rows:
        out.append(
            {
                "id": str(u.id),
                "email": u.email,
                "full_name": u.full_name,
                "username": u.username,
                "created_at": u.created_at.isoformat() if u.created_at else None,
                "last_login": last_login.isoformat() if last_login else None,
                "is_banned": bool(getattr(u, "is_banned", False)),
            }
        )
    return {"users": out, "limit": limit, "offset": offset}


@router.get("/active-count")
def active_users_count(
    days: int = Query(7, ge=1, le=365),
    _: User = Depends(require_global_admin),
    db: Session = Depends(get_db),
):
    """Count users considered "active" = last login within last N days."""

    since = datetime.now(timezone.utc) - timedelta(days=days)
    last_login_subq = (
        db.query(
            LoginHistory.user_id.label("user_id"),
            func.max(LoginHistory.login_time).label("last_login"),
        )
        .group_by(LoginHistory.user_id)
        .subquery()
    )

    count = (
        db.query(func.count(User.id))
        .select_from(User)
        .join(last_login_subq, last_login_subq.c.user_id == User.id)
        .filter(last_login_subq.c.last_login >= since)
        .scalar()
    )
    return {"days": days, "active_users": int(count or 0)}


@router.post("/users/{user_id}/ban")
def ban_user(
    user_id: str,
    _: User = Depends(require_global_admin),
    db: Session = Depends(get_db),
):
    try:
        uid = UUID(user_id)
    except Exception:
        raise HTTPException(status_code=422, detail="Invalid user_id")

    u = db.query(User).filter(User.id == uid).first()
    if not u:
        raise HTTPException(status_code=404, detail="User not found")

    u.is_banned = True
    db.commit()
    return {"id": str(u.id), "is_banned": True}


@router.post("/users/{user_id}/unban")
def unban_user(
    user_id: str,
    _: User = Depends(require_global_admin),
    db: Session = Depends(get_db),
):
    try:
        uid = UUID(user_id)
    except Exception:
        raise HTTPException(status_code=422, detail="Invalid user_id")

    u = db.query(User).filter(User.id == uid).first()
    if not u:
        raise HTTPException(status_code=404, detail="User not found")

    u.is_banned = False
    db.commit()
    return {"id": str(u.id), "is_banned": False}
