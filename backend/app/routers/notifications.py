# backend/app/routers/notifications.py
from __future__ import annotations

from datetime import datetime, timezone, timedelta
import html as _html
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query
from pydantic import BaseModel, ConfigDict, field_validator
from sqlalchemy.orm import Session

import json

from app.db import get_db, session_scope
from app.models.notification import Notification
from app.models.study_session import StudySession
from app.models.user import User
from app.services.email_sender import send_email
from app.services.session_reminders import rebuild_upcoming_session_email_reminders
from app.services.notification_processor import process_due_email_notifications_core
from app.services.jobs import create_job, get_job, run_job

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
    minutes_before: int = 2
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


def _build_start_session_deep_link(session_id: UUID) -> str:
    """Frontend deep-link used by CP-06: /?page=dashboard&startSession=<id>"""
    return f"/?page=dashboard&startSession={session_id}"


def _build_template_with_deep_link(message: str, session_id: Optional[UUID]) -> str:
    """Store deep link in template field (Text) to avoid schema changes."""
    if session_id is None:
        return message
    payload = {
        "type": "session_reminder",
        "message": message,
        "deep_link": _build_start_session_deep_link(session_id),
    }
    return json.dumps(payload)


def _parse_template(template: str) -> tuple[str, Optional[str]]:
    """Returns (message, deep_link). Template may be plain text or JSON."""
    if not template:
        return "", None
    raw = template.strip()
    if not raw:
        return "", None

    # Try JSON first
    try:
        payload = json.loads(raw)
        if isinstance(payload, dict):
            message = str(payload.get("message") or payload.get("text") or "")
            deep_link = payload.get("deep_link")
            return message or raw, deep_link
    except Exception:
        pass

    return raw, None


class ProcessNotificationsOut(BaseModel):
    processed: int
    sent: int
    failed: int
    skipped: int


class RebuildRemindersIn(BaseModel):
    user_id: UUID
    window_days: int = 7
    minutes_before: Optional[int] = None


class RebuildRemindersOut(BaseModel):
    scanned_sessions: int
    created: int
    updated: int
    cancelled_duplicates: int
    cancelled_non_planned: int


class TestEmailIn(BaseModel):
    user_id: Optional[UUID] = None
    to_email: Optional[str] = None


class TestEmailOut(BaseModel):
    sent_to: str


# -----------------------------
# Routes
# -----------------------------


class TestEmailIn(BaseModel):
    """Send a real test email using the configured provider (SMTP or SendGrid)."""

    user_id: UUID
    to_email: Optional[str] = None



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
        template=_build_template_with_deep_link(payload.template, payload.session_id),
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
        template=_build_template_with_deep_link("Study session reminder", payload.session_id),
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
    due_only: bool = Query(default=False, description="Only return notifications whose send time has arrived."),
    limit: int = Query(default=50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    q = db.query(Notification)

    if user_id is not None:
        q = q.filter(Notification.user_id == user_id)
    if status is not None:
        q = q.filter(Notification.status == status)
    if due_only:
        q = q.filter(Notification.send_at <= _utcnow())

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


@router.get("/jobs/{job_id}")
def get_notification_job(job_id: str):
    job = get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


@router.post("/process-email", response_model=None)
def process_due_email_notifications(
    background_tasks: BackgroundTasks,
    limit: int = Query(default=50, ge=1, le=500),
    async_job: bool = Query(default=True),
    db: Session = Depends(get_db),
):
    """Process due email notifications.

    Finds notifications with:
      - status == 'pending'
      - channel == 'email'
      - send_at <= now (UTC)

    Sends the email and marks status 'sent' or 'failed' with error_message.
    """
    if async_job:
        job_id = create_job("process-email-notifications")

        def _job() -> dict:
            with session_scope() as job_db:
                return process_due_email_notifications_core(db=job_db, limit=limit)

        background_tasks.add_task(run_job, job_id, _job)
        return {
            "accepted": True,
            "job_id": job_id,
            "status_url": f"/notifications/jobs/{job_id}",
        }

    res = process_due_email_notifications_core(db=db, limit=limit)
    return ProcessNotificationsOut(**res)


@router.post("/test-email", response_model=TestEmailOut)
def send_test_email(payload: TestEmailIn, db: Session = Depends(get_db)):
    """Send a real test email using configured EMAIL_PROVIDER.

    If to_email isn't provided, uses the user's email.
    """
    to_email = (payload.to_email or "").strip() or None
    if to_email is None:
        if payload.user_id is None:
            raise HTTPException(status_code=422, detail="Provide to_email or user_id")
        user = db.query(User).filter(User.id == payload.user_id).first()
        if not user or not user.email:
            raise HTTPException(status_code=404, detail="User email not found")
        to_email = user.email

    subject = "U Plan: Test Email"
    body_text = "This is a test email from U Plan.\n\nIf you received this, email sending is configured correctly.\n"
    body_html = (
        "<div style='font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial'>"
        "<h3 style='margin:0 0 12px 0'>U Plan Test Email</h3>"
        "<p style='margin:0 0 12px 0'>If you received this, email sending is configured correctly.</p>"
        "</div>"
    )

    send_email(to_email=to_email, subject=subject, body_text=body_text, body_html=body_html)
    return TestEmailOut(sent_to=to_email)


@router.post("/rebuild-session-reminders", response_model=RebuildRemindersOut)
def rebuild_session_reminders(payload: RebuildRemindersIn, db: Session = Depends(get_db)):
    """Rebuild upcoming timetable/session email reminders for a user.

    This is safe to call multiple times (dedupes).
    """
    res = rebuild_upcoming_session_email_reminders(
        db=db,
        user_id=payload.user_id,
        window_days=payload.window_days,
        minutes_before=payload.minutes_before,
    )
    return RebuildRemindersOut(**res.__dict__)
