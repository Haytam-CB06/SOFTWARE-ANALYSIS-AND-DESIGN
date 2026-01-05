from __future__ import annotations

from datetime import datetime, timezone
import html as _html
from typing import Optional

from sqlalchemy.orm import Session

from app.models.notification import Notification
from app.models.user import User
from app.services.email_sender import send_email, load_smtp_settings, build_absolute_url


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _parse_template(template: str) -> tuple[str, Optional[str]]:
    """Returns (message, deep_link). Template may be plain text or JSON."""
    if not template:
        return "", None
    raw = template.strip()
    if not raw:
        return "", None

    # Try JSON first
    try:
        import json

        payload = json.loads(raw)
        if isinstance(payload, dict):
            message = str(payload.get("message") or payload.get("text") or "")
            deep_link = payload.get("deep_link")
            return message or raw, deep_link
    except Exception:
        pass

    return raw, None


def process_due_email_notifications_core(*, db: Session, limit: int = 50) -> dict:
    """Process due email notifications and send emails.

    Returns a dict: {processed, sent, failed, skipped}
    """
    now = _utcnow()

    due = (
        db.query(Notification)
        .filter(Notification.status == "pending")
        .filter(Notification.channel == "email")
        .filter(Notification.send_at <= now)
        .order_by(Notification.send_at.asc())
        .limit(limit)
        .all()
    )

    sent = 0
    failed = 0
    skipped = 0

    # Mark selected rows as processing to reduce duplicate sends.
    for n in due:
        n.status = "processing"
        n.error_message = None
    db.commit()

    settings = load_smtp_settings()  # for FRONTEND_BASE_URL deep link building

    for n in due:
        try:
            user = db.query(User).filter(User.id == n.user_id).first()
            if not user or not user.email:
                skipped += 1
                n.status = "failed"
                n.error_message = "User email not found"
                continue

            message, deep_link = _parse_template(n.template)
            absolute_link = None
            if deep_link:
                absolute_link = build_absolute_url(str(deep_link), settings)

            subject = "U Plan: Study session reminder"

            body_lines = []
            if message:
                body_lines.append(message)
            if absolute_link:
                body_lines.append("")
                body_lines.append("Open your session:")
                body_lines.append(absolute_link)
            body_lines.append("")
            body_lines.append("— U Plan")

            body_text = "\n".join(body_lines).strip() + "\n"
            safe_message = _html.escape(message or "")
            body_html = (
                "<div style='font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial'>"
                "<h3 style='margin:0 0 12px 0'>U Plan Reminder</h3>"
                f"<p style='margin:0 0 12px 0'>{safe_message}</p>"
            )
            if absolute_link:
                body_html += (
                    "<p style='margin:16px 0'>"
                    f"<a href='{absolute_link}' style='display:inline-block;padding:10px 14px;border-radius:8px;"
                    "text-decoration:none;border:1px solid #ccc'>Open your session</a>"
                    "</p>"
                )
            body_html += "<p style='color:#666;margin-top:18px'>— U Plan</p></div>"

            send_email(to_email=user.email, subject=subject, body_text=body_text, body_html=body_html)

            n.status = "sent"
            n.error_message = None
            sent += 1
        except Exception as e:
            n.status = "failed"
            n.error_message = (str(e) or "Unknown error")[:500]
            failed += 1

    db.commit()
    return {"processed": len(due), "sent": sent, "failed": failed, "skipped": skipped}
