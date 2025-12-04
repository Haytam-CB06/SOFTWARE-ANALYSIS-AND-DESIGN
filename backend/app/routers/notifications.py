# backend/app/routers/notifications.py
from datetime import datetime, timezone, timedelta
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, field_validator
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.notification import Notification
from app.models.study_session import StudySession

router = APIRouter(prefix="/notifications", tags=["Notifications"])


# --------- Pydantic Schemas ---------

class NotificationCreate(BaseModel):
    user_id: UUID
    session_id: Optional[UUID] = None
    channel: str  # e.g. "alarm", "email"
    template: str
    send_at: datetime

    @field_validator("channel")
    @classmethod
    def valid_channel(cls, v: str) -> str:
        allowed = {"alarm", "email", "sms"}
        if v not in allowed:
            raise ValueError(f"channel must be one of {allowed}")
        return v


class SessionAlarmCreate(BaseModel):
    user_id: UUID
    session_id: UUID
    minutes_before: int = 15
    channel: str = "alarm"


class NotificationOut(BaseModel):
    id: UUID
    user_id: UUID
    session_id: Optional[UUID]
    channel: str
    template: str
    send_at: datetime
    status: str
    error_message: Optional[str] = None

    class Config:
        orm_mode = True


# --------- CRUD ENDPOINTS ---------


@router.post("/", response_model=NotificationOut)
def create_notification(
    payload: NotificationCreate,
    db: Session = Depends(get_db),
):
    notif = Notification(
        user_id=payload.user_id,
        session_id=payload.session_id,
        channel=payload.channel,
        template=payload.template,
        send_at=payload.send_at,
        status="scheduled",
    )
    db.add(notif)
    db.flush()
    db.refresh(notif)
    return notif


@router.post("/session-alarm", response_model=NotificationOut)
def create_session_alarm(
    payload: SessionAlarmCreate,
    db: Session = Depends(get_db),
):
    # Ensure session exists and belongs to the user (basic safety)
    session_obj = (
        db.query(StudySession)
        .filter(
            StudySession.id == payload.session_id,
            StudySession.user_id == payload.user_id,
        )
        .first()
    )
    if not session_obj:
        raise HTTPException(status_code=404, detail="StudySession not found for this user")

    send_at = session_obj.start_at - timedelta(minutes=payload.minutes_before)
    if send_at < datetime.now(timezone.utc):
        # if it's already in the past, just schedule for now
        send_at = datetime.now(timezone.utc)

    notif = Notification(
        user_id=payload.user_id,
        session_id=payload.session_id,
        channel=payload.channel,
        template="session_reminder",
        send_at=send_at,
        status="scheduled",
    )
    db.add(notif)
    db.flush()
    db.refresh(notif)
    return notif


@router.get("/user/{user_id}", response_model=List[NotificationOut])
def list_user_notifications(
    user_id: UUID,
    db: Session = Depends(get_db),
):
    items = (
        db.query(Notification)
        .filter(Notification.user_id == user_id)
        .order_by(Notification.send_at.desc())
        .all()
    )
    return items


@router.get("/{notification_id}", response_model=NotificationOut)
def get_notification(
    notification_id: UUID,
    db: Session = Depends(get_db),
):
    notif = db.query(Notification).get(notification_id)
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    return notif


@router.delete("/{notification_id}")
def delete_notification(
    notification_id: UUID,
    db: Session = Depends(get_db),
):
    notif = db.query(Notification).get(notification_id)
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    db.delete(notif)
    return {"ok": True}


# --------- Simple "alarm" dispatcher ---------


@router.post("/dispatch-due")
def dispatch_due_notifications(
    limit: int = Query(50, ge=1, le=500),
    db: Session = Depends(get_db),
):
    """
    Find all scheduled notifications that are due and mark them as 'sent'.

    In a real system, this is where you'd:
    - send push notifications
    - send emails/SMS
    For now, we just flip the status so the UI can show that they fired.
    """
    now = datetime.now(timezone.utc)

    due = (
        db.query(Notification)
        .filter(Notification.status == "scheduled", Notification.send_at <= now)
        .order_by(Notification.send_at)
        .limit(limit)
        .all()
    )

    for notif in due:
        # TODO: integrate real delivery (email, mobile push, etc.)
        notif.status = "sent"

    return {"dispatched": len(due)}
