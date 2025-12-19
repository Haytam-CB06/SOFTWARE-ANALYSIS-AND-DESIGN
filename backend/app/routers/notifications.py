# backend/app/routers/notifications.py
from __future__ import annotations

from datetime import datetime, timezone, timedelta
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, ConfigDict, field_validator
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.notification import Notification
from app.models.study_session import StudySession

router = APIRouter(prefix="/notifications", tags=["Notifications"])


# -----------------------------
# Pydantic Schemas
# -----------------------------
class NotificationCreate(BaseModel):
    user_id: UUID
    session_id: Optional[UUID] = None
    channel: str = "alarm"  # e.g. "alarm", "email", "push"
    template: str = "Study session reminder"
    send_at: Optional[datetime] = None  # if None, computed based on session & minutes_before

    @field_validator("channel")
    @classmethod
    def validate_channel(cls, v: str) -> str:
        v = (v or "").strip().lower()
        if v not in {"alarm", "email", "push"}:
            raise ValueError("channel must be one of: alarm, email, push")
        return v

    @field_validator("send_at")
    @classmethod
    def validate_send_at(cls, v: Optional[datetime]) -> Optional[datetime]:
        # Allow None; if provided, require timezone-aware to avoid ambiguity
        if v is not None and v.tzinfo is None:
            raise ValueError("send_at must be timezone-aware (include timezone offset)")
        return v


class NotificationUpdate(BaseModel):
    status: Optional[str] = None  # e.g. "pending", "sent", "failed", "cancelled"
    error_message: Optional[str] = None


class SessionAlarmCreate(BaseModel):
    user_id: UUID
    session_id: UUID
    minutes_before: int = 15
    channel: str = "alarm"

    @field_validator("minutes_before")
    @classmethod
    def validate_minutes_before(cls, v: int) -> int:
        if v < 0 or v > 24 * 60:
            raise ValueError("minutes_before must be between 0 and 1440")
        return v

    @field_validator("channel")
    @classmethod
    def validate_channel(cls, v: str) -> str:
        v = (v or "").strip().lower()
        if v not in {"alarm", "email", "push"}:
            raise ValueError("channel must be one of: alarm, email, push")
        return v


class NotificationOut(BaseModel):
    id: UUID
    user_id: UUID
    session_id: Optional[UUID]
    channel: str
    template: str
    send_at: datetime
    status: str
    error_message: Optional[str] = None

    # Pydantic v2 replacement for orm_mode=True
    model_config = ConfigDict(from_attributes=True)


# -----------------------------
# Helpers
# -----------------------------
def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _ensure_session_exists(db: Session, session_id: UUID) -> StudySession:
    session = db.query(StudySession).filter(StudySession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Study session not found")
    return session


def _compute_send_at_from_session(session: StudySession, minutes_before: int) -> datetime:
    """
    Tries to compute when to notify based on session start.
    This assumes StudySession has a start_datetime or equivalent.

    If your model uses a different field name, adjust here:
      - start_time / start_datetime / starts_at, etc.
    """
    # Common field names: start_datetime, starts_at, start_time (datetime)
    start_dt = None
    for attr in ("start_datetime", "starts_at", "start_time", "start_at"):
        if hasattr(session, attr):
            start_dt = getattr(session, attr)
            break

    if start_dt is None:
        raise HTTPException(
            status_code=500,
            detail="StudySession model missing start datetime field (expected start_datetime/starts_at/start_time/start_at).",
        )

    # Ensure timezone-aware; assume UTC if naive
    if start_dt.tzinfo is None:
        start_dt = start_dt.replace(tzinfo=timezone.utc)

    return start_dt - timedelta(minutes=minutes_before)


# -----------------------------
# Routes
# -----------------------------
@router.post("/", response_model=NotificationOut)
def create_notification(payload: NotificationCreate, db: Session = Depends(get_db)):
    send_at = payload.send_at

    # If send_at not provided, try to compute it from session (if given)
    if send_at is None and payload.session_id is not None:
        session = _ensure_session_exists(db, payload.session_id)
        # Default 15 min before if caller didn’t specify send_at
        send_at = _compute_send_at_from_session(session, minutes_before=15)

    if send_at is None:
        # Fallback: schedule “now” if no session_id and no send_at
        send_at = _utcnow()

    n = Notification(
        user_id=payload.user_id,
        session_id=payload.session_id,
        channel=payload.channel,
        template=payload.template,
        send_at=send_at,
        status="pending",
        error_message=None,
    )
    db.add(n)
    db.commit()
    db.refresh(n)
    return n


@router.post("/session-alarm", response_model=NotificationOut)
def create_session_alarm(payload: SessionAlarmCreate, db: Session = Depends(get_db)):
    session = _ensure_session_exists(db, payload.session_id)
    send_at = _compute_send_at_from_session(session, minutes_before=payload.minutes_before)

    n = Notification(
        user_id=payload.user_id,
        session_id=payload.session_id,
        channel=payload.channel,
        template="Study session reminder",
        send_at=send_at,
        status="pending",
        error_message=None,
    )
    db.add(n)
    db.commit()
    db.refresh(n)
    return n


@router.get("/", response_model=List[NotificationOut])
def list_notifications(
    user_id: Optional[UUID] = Query(default=None),
    status: Optional[str] = Query(default=None),
    limit: int = Query(default=50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    q = db.query(Notification)

    if user_id is not None:
        q = q.filter(Notification.user_id == user_id)
    if status is not None:
        q = q.filter(Notification.status == status)

    # Most recent first
    q = q.order_by(Notification.send_at.desc())

    return q.limit(limit).all()


@router.get("/{notification_id}", response_model=NotificationOut)
def get_notification(notification_id: UUID, db: Session = Depends(get_db)):
    n = db.query(Notification).filter(Notification.id == notification_id).first()
    if not n:
        raise HTTPException(status_code=404, detail="Notification not found")
    return n


@router.patch("/{notification_id}", response_model=NotificationOut)
def update_notification(notification_id: UUID, payload: NotificationUpdate, db: Session = Depends(get_db)):
    n = db.query(Notification).filter(Notification.id == notification_id).first()
    if not n:
        raise HTTPException(status_code=404, detail="Notification not found")

    if payload.status is not None:
        n.status = payload.status
    if payload.error_message is not None:
        n.error_message = payload.error_message

    db.commit()
    db.refresh(n)
    return n


@router.delete("/{notification_id}")
def delete_notification(notification_id: UUID, db: Session = Depends(get_db)):
    n = db.query(Notification).filter(Notification.id == notification_id).first()
    if not n:
        raise HTTPException(status_code=404, detail="Notification not found")

    db.delete(n)
    db.commit()
    return {"detail": "Deleted"}
