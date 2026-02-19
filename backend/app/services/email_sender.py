"""Email sending utilities.

This project previously supported SMTP-only sending. CP-13 expands support to:
  - SMTP (existing)
  - SendGrid Web API v3 (optional)

Configuration (preferred):
  - EMAIL_PROVIDER=smtp|sendgrid (default: smtp)
  - FRONTEND_BASE_URL (used to build absolute deep links)

SMTP env vars:
  - SMTP_HOST (default: smtp.gmail.com)
  - SMTP_PORT (default: 587)
  - SMTP_USER
  - SMTP_PASS
  - SMTP_FROM (optional; defaults to SMTP_USER)

SendGrid env vars:
  - SENDGRID_API_KEY
  - SENDGRID_FROM
"""

from __future__ import annotations

import json
import os
import smtplib
import ssl
import urllib.request
from dataclasses import dataclass
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Optional


@dataclass(frozen=True)
class SMTPSettings:
    host: str
    port: int
    user: Optional[str]
    password: Optional[str]
    sender: Optional[str]
    frontend_base_url: str


@dataclass(frozen=True)
class SendGridSettings:
    api_key: str
    sender: str
    frontend_base_url: str


def _frontend_base_url() -> str:
    return (
        (os.getenv("FRONTEND_BASE_URL") or "").strip()
        or (os.getenv("FRONTEND_ORIGIN") or "").strip()
        or "https://uplan-frontend-bccb.onrender.com"
    )


def load_smtp_settings() -> SMTPSettings:
    host = (os.getenv("SMTP_HOST") or "smtp.gmail.com").strip()
    port_raw = (os.getenv("SMTP_PORT") or "587").strip()

    # Preferred names
    user = (os.getenv("SMTP_USER") or "").strip() or None
    password = (os.getenv("SMTP_PASS") or "").strip() or None
    sender = (os.getenv("SMTP_FROM") or "").strip() or None

    # Back-compat names
    if not user:
        user = (os.getenv("SMTP_EMAIL") or "").strip() or None
    if not password:
        password = (os.getenv("SMTP_PASSWORD") or "").strip() or None
    if not sender:
        sender = user

    try:
        port = int(port_raw)
    except Exception as e:
        raise ValueError(f"Invalid SMTP_PORT: {port_raw}") from e

    return SMTPSettings(
        host=host,
        port=port,
        user=user,
        password=password,
        sender=sender,
        frontend_base_url=_frontend_base_url(),
    )


def load_sendgrid_settings() -> SendGridSettings:
    api_key = (os.getenv("SENDGRID_API_KEY") or "").strip()
    sender = (os.getenv("SENDGRID_FROM") or "").strip()
    if not api_key:
        raise RuntimeError("SendGrid not configured: set SENDGRID_API_KEY")
    if not sender:
        raise RuntimeError("SendGrid not configured: set SENDGRID_FROM")

    return SendGridSettings(api_key=api_key, sender=sender, frontend_base_url=_frontend_base_url())


def build_absolute_url(path_or_url: str, settings_or_frontend_base_url) -> str:
    """Turn a relative deep link like '/?page=...' into an absolute URL."""
    raw = (path_or_url or "").strip()
    if not raw:
        return ""
    if raw.startswith("http://") or raw.startswith("https://"):
        return raw

    # Back-compat: older code passes the SMTPSettings dataclass.
    if hasattr(settings_or_frontend_base_url, "frontend_base_url"):
        frontend_base_url = getattr(settings_or_frontend_base_url, "frontend_base_url")
    else:
        frontend_base_url = settings_or_frontend_base_url

    base = (frontend_base_url or "").rstrip("/")
    if not raw.startswith("/"):
        raw = "/" + raw
    return base + raw


def _provider() -> str:
    return (os.getenv("EMAIL_PROVIDER") or "smtp").strip().lower()


def send_email(*, to_email: str, subject: str, body_text: str, body_html: Optional[str] = None) -> None:
    """Send an email using the configured provider.

    - If EMAIL_PROVIDER=smtp (default), uses SMTP_* env vars.
    - If EMAIL_PROVIDER=sendgrid, uses SendGrid Web API.
    """

    provider = _provider()
    if provider == "sendgrid":
        _send_sendgrid(to_email=to_email, subject=subject, body_text=body_text, body_html=body_html)
        return

    # Default: SMTP
    _send_smtp(to_email=to_email, subject=subject, body_text=body_text, body_html=body_html)


def _send_smtp(*, to_email: str, subject: str, body_text: str, body_html: Optional[str]) -> None:
    settings = load_smtp_settings()
    if not settings.user or not settings.password:
        raise RuntimeError("SMTP not configured: set SMTP_USER/SMTP_PASS (or SMTP_EMAIL/SMTP_PASSWORD).")

    if body_html:
        msg = MIMEMultipart("alternative")
        msg.attach(MIMEText(body_text or "", "plain", _charset="utf-8"))
        msg.attach(MIMEText(body_html or "", "html", _charset="utf-8"))
    else:
        msg = MIMEText(body_text or "", _charset="utf-8")

    msg["From"] = settings.sender or settings.user
    msg["To"] = to_email
    msg["Subject"] = subject

    context = ssl.create_default_context()
    with smtplib.SMTP(settings.host, settings.port, timeout=20) as server:
        server.starttls(context=context)
        server.login(settings.user, settings.password)
        server.send_message(msg)


def _send_sendgrid(*, to_email: str, subject: str, body_text: str, body_html: Optional[str]) -> None:
    settings = load_sendgrid_settings()
    url = "https://api.sendgrid.com/v3/mail/send"

    contents = [{"type": "text/plain", "value": body_text or ""}]
    if body_html:
        contents.append({"type": "text/html", "value": body_html})

    payload = {
        "personalizations": [{"to": [{"email": to_email}]}],
        "from": {"email": settings.sender},
        "subject": subject,
        "content": contents,
    }

    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=data,
        method="POST",
        headers={
            "Authorization": f"Bearer {settings.api_key}",
            "Content-Type": "application/json",
        },
    )

    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            # SendGrid returns 202 on accepted.
            if resp.status not in (200, 202):
                raise RuntimeError(f"SendGrid error: HTTP {resp.status}")
    except Exception as e:
        raise RuntimeError(f"SendGrid send failed: {e}")
