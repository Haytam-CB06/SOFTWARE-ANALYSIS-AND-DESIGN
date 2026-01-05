from __future__ import annotations

import json
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Optional
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.notification import Notification
from app.models.preferences import Preferences
from app.models.study_session import StudySession


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _build_start_session_deep_link(session_id: UUID) -> str:
    # Frontend deep-link used by dashboard auto-start
    return f"/?page=dashboard&startSession={session_id}"


def _build_template(message: str, session_id: UUID) -> str:
    payload = {
        "type": "session_reminder",
        "message": message,
        "deep_link": _build_start_session_deep_link(session_id),
    }
    return json.dumps(payload)


@dataclass
class ReminderRebuildResult:
    scanned_sessions: int = 0
    created: int = 0
    updated: int = 0
    cancelled_duplicates: int = 0
    cancelled_non_planned: int = 0


def rebuild_upcoming_session_email_reminders(
    db: Session,
    user_id: UUID,
    window_days: int = 7,
    minutes_before: Optional[int] = None,
    now: Optional[datetime] = None,
) -> ReminderRebuildResult:
    """(Re)build upcoming email reminders for planned sessions.

    - Scans StudySession.status == 'planned' in [now, now + window_days]
    - Creates or updates pending email notifications for each session
    - Dedupes by (user_id, session_id, channel, send_at)
    - Cancels duplicates and reminders for non-planned sessions inside the window
    """

    if now is None:
        now = _utcnow()
    if now.tzinfo is None:
        now = now.replace(tzinfo=timezone.utc)

    end = now + timedelta(days=int(window_days))
    res = ReminderRebuildResult()

    # Load user preferences (create defaults if missing)
    prefs = db.query(Preferences).filter(Preferences.user_id == user_id).first()
    if prefs is None:
        prefs = Preferences(user_id=user_id)
        db.add(prefs)
        db.commit()
        db.refresh(prefs)

    if prefs.email_reminders_enabled is False:
        # Cancel any existing pending reminders inside window (so turning off is immediate)
        pending = (
            db.query(Notification)
            .filter(Notification.user_id == user_id)
            .filter(Notification.channel == "email")
            .filter(Notification.status == "pending")
            .filter(Notification.session_id.isnot(None))
            .filter(Notification.send_at >= now)
            .filter(Notification.send_at <= end)
            .all()
        )
        for n in pending:
            n.status = "cancelled"
            n.error_message = "Reminders disabled"
            res.cancelled_non_planned += 1
        db.commit()
        return res

    if minutes_before is None:
        minutes_before = int(prefs.email_reminder_minutes_before or 10)

    # Cancel reminders for sessions that are no longer planned (inside window)
    candidates = (
        db.query(Notification)
        .filter(Notification.user_id == user_id)
        .filter(Notification.channel == "email")
        .filter(Notification.status == "pending")
        .filter(Notification.send_at >= now)
        .filter(Notification.send_at <= end)
        .filter(Notification.session_id.isnot(None))
        .all()
    )
    if candidates:
        # Map session_id -> status
        session_ids = list({n.session_id for n in candidates if n.session_id is not None})
        sessions = (
            db.query(StudySession)
            .filter(StudySession.user_id == user_id)
            .filter(StudySession.id.in_(session_ids))
            .all()
        )
        status_by_id = {s.id: s.status for s in sessions}
        for n in candidates:
            st = status_by_id.get(n.session_id)
            if st is not None and st != "planned":
                n.status = "cancelled"
                n.error_message = "Session is not planned"
                res.cancelled_non_planned += 1

    # Scan upcoming planned sessions
    upcoming = (
        db.query(StudySession)
        .filter(StudySession.user_id == user_id)
        .filter(StudySession.status == "planned")
        .filter(StudySession.start_at >= now)
        .filter(StudySession.start_at <= end)
        .order_by(StudySession.start_at.asc())
        .all()
    )
    res.scanned_sessions = len(upcoming)

    for s in upcoming:
        desired_send_at = s.start_at - timedelta(minutes=int(minutes_before))
        if desired_send_at.tzinfo is None:
            desired_send_at = desired_send_at.replace(tzinfo=timezone.utc)
        # If we are within the buffer window, send immediately
        if desired_send_at < now:
            desired_send_at = now

        msg = f"Reminder: your study session starts at {s.start_at.astimezone(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}."
        desired_template = _build_template(msg, s.id)

        existing = (
            db.query(Notification)
            .filter(Notification.user_id == user_id)
            .filter(Notification.session_id == s.id)
            .filter(Notification.channel == "email")
            .filter(Notification.status == "pending")
            .order_by(Notification.send_at.asc())
            .all()
        )

        # If there is already an exact match by send_at, keep it and cancel the rest
        match = None
        for n in existing:
            if n.send_at == desired_send_at:
                match = n
                break

        if match is None:
            if existing:
                # Update the earliest one
                n0 = existing[0]
                n0.send_at = desired_send_at
                n0.template = desired_template
                n0.error_message = None
                res.updated += 1
                match = n0
            else:
                n_new = Notification(
                    user_id=user_id,
                    session_id=s.id,
                    channel="email",
                    template=desired_template,
                    send_at=desired_send_at,
                    status="pending",
                    error_message=None,
                )
                db.add(n_new)
                res.created += 1
                match = n_new

        # Ensure template is updated on the kept one
        if match is not None and match.template != desired_template:
            match.template = desired_template

        # Cancel duplicates (any other pending email reminders for this session)
        for n in existing:
            if match is not None and n.id == match.id:
                continue
            n.status = "cancelled"
            n.error_message = "Deduped by reminder rebuild"
            res.cancelled_duplicates += 1

    db.commit()
    return res

def rebuild_user_session_reminders(
    db: Session,
    user_id: UUID,
    window_days: int = 7,
    minutes_before: Optional[int] = None,
    now: Optional[datetime] = None,
) -> ReminderRebuildResult:
    return rebuild_upcoming_session_email_reminders(
        db=db,
        user_id=user_id,
        window_days=window_days,
        minutes_before=minutes_before,
        now=now,
    )
