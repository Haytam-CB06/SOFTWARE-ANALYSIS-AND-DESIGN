"""
Background worker: creates + sends email session reminders.

Scope:
- "Notifications" are DB records (notifications table) + deep links.
- No push notifications (FCM/APNS) here.
- Emails are sent 2 minutes before a planned StudySession starts.

Notes:
- Runs a small daemon thread started on FastAPI startup.
- Uses Notification.status to prevent duplicate sends.
"""
from __future__ import annotations

import json
import os
import threading
import time
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from email.mime.text import MIMEText
from typing import Optional, Tuple

import smtplib
from sqlalchemy.orm import Session

from app.db import session_scope
from app.models.notification import Notification
from app.models.study_session import StudySession
from app.models.user import User


REMINDER_MINUTES_BEFORE = int(os.getenv("SESSION_REMINDER_MINUTES_BEFORE", "2"))
POLL_SECONDS = int(os.getenv("NOTIFICATION_POLL_SECONDS", "30"))


@dataclass
class SmtpConfig:
    host: str
    port: int
    username: str
    password: str
    use_tls: bool = True


class SmtpConfigError(RuntimeError):
    pass


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _frontend_base_url() -> str:
    # Prefer an explicit base URL for absolute links in emails
    return (
        os.getenv("FRONTEND_BASE_URL")
        or os.getenv("FRONTEND_ORIGIN")
        or "http://localhost:5173"
    ).rstrip("/")


def _absolute_link(relative_or_abs: str) -> str:
    if not relative_or_abs:
        return _frontend_base_url()
    if relative_or_abs.startswith("http://") or relative_or_abs.startswith("https://"):
        return relative_or_abs
    if not relative_or_abs.startswith("/"):
        relative_or_abs = "/" + relative_or_abs
    return _frontend_base_url() + relative_or_abs


def _load_smtp_config() -> SmtpConfig:
    host = os.getenv("SMTP_HOST") or os.getenv("SMTP_SERVER") or os.getenv("SMTP_ADDRESS")
    port_raw = os.getenv("SMTP_PORT") or os.getenv("SMTP_SERVER_PORT") or "587"
    username = os.getenv("SMTP_EMAIL") or os.getenv("SMTP_USERNAME")
    password = os.getenv("SMTP_PASSWORD") or os.getenv("SMTP_PASS")
    use_tls = (os.getenv("SMTP_USE_TLS", "true").strip().lower() != "false")

    missing = []
    if not host:
        missing.append("SMTP_HOST (or SMTP_SERVER)")
    if not username:
        missing.append("SMTP_EMAIL (or SMTP_USERNAME)")
    if not password:
        missing.append("SMTP_PASSWORD")
    try:
        port = int(port_raw)
    except Exception:
        raise SmtpConfigError("Invalid SMTP_PORT (must be an integer).")

    if missing:
        raise SmtpConfigError("SMTP is not configured: missing " + ", ".join(missing) + ".")

    return SmtpConfig(host=host, port=port, username=username, password=password, use_tls=use_tls)


def _send_email(to_email: str, subject: str, body_text: str) -> None:
    cfg = _load_smtp_config()

    msg = MIMEText(body_text, "plain", "utf-8")
    msg["Subject"] = subject
    msg["From"] = cfg.username
    msg["To"] = to_email

    with smtplib.SMTP(cfg.host, cfg.port, timeout=15) as server:
        if cfg.use_tls:
            server.starttls()
        server.login(cfg.username, cfg.password)
        server.sendmail(cfg.username, [to_email], msg.as_string())


def _parse_template(template: str) -> Tuple[str, Optional[str]]:
    """
    template can be plain text or JSON string:
      {"type":"session_reminder","message":"...","deep_link":"/?page=..."}
    Returns: (message, deep_link_or_none)
    """
    if not template:
        return ("Study session reminder", None)

    t = template.strip()
    if t.startswith("{") and t.endswith("}"):
        try:
            payload = json.loads(t)
            msg = payload.get("message") or "Study session reminder"
            deep = payload.get("deep_link")
            return (msg, deep)
        except Exception:
            # fall back to raw text
            return (template, None)

    return (template, None)


def ensure_upcoming_session_notifications(db: Session) -> int:
    """
    Ensure a Notification record exists for sessions starting soon.
    We only create records for the email channel.
    """
    now = _utcnow()
    # Look ahead a bit beyond the exact window to be robust to poll timing.
    lookahead_start = now + timedelta(minutes=REMINDER_MINUTES_BEFORE)
    lookahead_end = now + timedelta(minutes=REMINDER_MINUTES_BEFORE + 5)

    sessions = (
        db.query(StudySession)
        .filter(StudySession.status == "planned")
        .filter(StudySession.start_at >= lookahead_start)
        .filter(StudySession.start_at <= lookahead_end)
        .all()
    )

    created = 0
    for s in sessions:
        send_at = s.start_at - timedelta(minutes=REMINDER_MINUTES_BEFORE)

        existing = (
            db.query(Notification)
            .filter(Notification.session_id == s.id)
            .filter(Notification.channel == "email")
            .filter(Notification.send_at == send_at)
            .first()
        )
        if existing:
            continue

        payload = {
            "type": "session_reminder",
            "message": "Your study session starts soon.",
            "deep_link": f"/?page=dashboard&startSession={s.id}",
        }

        n = Notification(
            user_id=s.user_id,
            session_id=s.id,
            channel="email",
            template=json.dumps(payload),
            send_at=send_at,
            status="pending",
            error_message=None,
        )
        db.add(n)
        created += 1

    return created


def send_due_notifications(db: Session) -> int:
    now = _utcnow()
    due = (
        db.query(Notification)
        .filter(Notification.channel == "email")
        .filter(Notification.status == "pending")
        .filter(Notification.send_at <= now)
        .order_by(Notification.send_at.asc())
        .limit(50)
        .all()
    )

    sent = 0
    for n in due:
        try:
            user = db.query(User).filter(User.id == n.user_id).first()
            if not user or not user.email:
                raise RuntimeError("User email not found.")

            message, deep_link = _parse_template(n.template)
            link = _absolute_link(deep_link or "/?page=dashboard")
            subject = "Study session reminder"
            body = (
                f"{message}\n\n"
                f"Start your session now:\n{link}\n\n"
                f"(This reminder was scheduled {REMINDER_MINUTES_BEFORE} minutes before your session.)"
            )

            _send_email(user.email, subject, body)

            n.status = "sent"
            n.error_message = None
            sent += 1
        except SmtpConfigError as e:
            # Config missing/invalid: mark as error but with a clear message.
            n.status = "error"
            n.error_message = str(e)[:800]
        except Exception as e:
            n.status = "error"
            n.error_message = (str(e) or "Unknown SMTP error")[:800]

    return sent


_stop_event = threading.Event()
_thread: Optional[threading.Thread] = None


def start_notification_worker() -> None:
    global _thread
    if _thread and _thread.is_alive():
        return

    def _loop():
        while not _stop_event.is_set():
            try:
                with session_scope() as db:
                    ensure_upcoming_session_notifications(db)
                    send_due_notifications(db)
            except Exception:
                # Keep the worker alive even if something unexpected happens.
                pass
            time.sleep(POLL_SECONDS)

    _thread = threading.Thread(target=_loop, name="notification-email-worker", daemon=True)
    _thread.start()


def stop_notification_worker() -> None:
    _stop_event.set()
