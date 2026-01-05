from __future__ import annotations

from datetime import datetime, timedelta
from zoneinfo import ZoneInfo
from typing import List, Optional
from uuid import UUID

import json
from urllib.parse import quote

from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import Response
from pydantic import BaseModel, field_validator

from app.db import get_db
from sqlalchemy.orm import Session

from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request as GoogleRequest
from googleapiclient.discovery import build

from app.models.google_calendar_link import GoogleCalendarLink
from app.models.user import User


router = APIRouter(prefix="/calendar", tags=["Calendar"])


class ExportSessionIn(BaseModel):
    subject: str
    day: int  # 0=Monday .. 6=Sunday (frontend convention)
    startTime: str  # HH:MM
    endTime: str  # HH:MM
    description: Optional[str] = None

    @field_validator("day")
    @classmethod
    def _validate_day(cls, v: int) -> int:
        if v < 0 or v > 6:
            raise ValueError("day must be between 0 and 6")
        return v


class ExportRequest(BaseModel):
    sessions: List[ExportSessionIn]
    # Week start (Monday) in YYYY-MM-DD. If omitted, use current week's Monday.
    week_start: Optional[str] = None


def _monday_of_week(dt: datetime) -> datetime:
    return dt - timedelta(days=(dt.weekday()))


def _parse_hhmm(hhmm: str) -> tuple[int, int]:
    try:
        h, m = hhmm.split(":")
        return int(h), int(m)
    except Exception:
        raise HTTPException(status_code=400, detail=f"Invalid time format: {hhmm}. Expected HH:MM")


def _ics_escape(s: str) -> str:
    return (
        (s or "")
        .replace("\\", "\\\\")
        .replace(";", "\\;")
        .replace(",", "\\,")
        .replace("\n", "\\n")
    )


@router.post("/export-ics")
def export_ics(payload: ExportRequest):
    """Return an .ics file that the user can import into Google Calendar.

    This intentionally does *not* require OAuth so that it works in the course demo.
    """
    now = datetime.now()
    if payload.week_start:
        try:
            base = datetime.fromisoformat(payload.week_start)
        except Exception:
            raise HTTPException(status_code=400, detail="week_start must be in YYYY-MM-DD format")
    else:
        base = _monday_of_week(now)

    lines: list[str] = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//SmartStudy//UPLAN//EN",
        "CALSCALE:GREGORIAN",
        "METHOD:PUBLISH",
    ]

    # Create one-week events (no recurrence) so the export is predictable.
    for idx, s in enumerate(payload.sessions):
        title = (s.subject or "Study Session").strip() or "Study Session"
        sh, sm = _parse_hhmm(s.startTime)
        eh, em = _parse_hhmm(s.endTime)

        start_dt = base + timedelta(days=s.day, hours=sh, minutes=sm)
        end_dt = base + timedelta(days=s.day, hours=eh, minutes=em)
        if end_dt <= start_dt:
            # Simple guard; skip invalid sessions
            continue

        uid = f"uplan-{start_dt.strftime('%Y%m%dT%H%M%S')}-{idx}@smartstudy"
        dtstamp = datetime.utcnow().strftime("%Y%m%dT%H%M%SZ")

        lines.extend(
            [
                "BEGIN:VEVENT",
                f"UID:{uid}",
                f"DTSTAMP:{dtstamp}",
                f"SUMMARY:{_ics_escape(title)}",
                f"DTSTART:{start_dt.strftime('%Y%m%dT%H%M%S')}",
                f"DTEND:{end_dt.strftime('%Y%m%dT%H%M%S')}",
            ]
        )
        if s.description:
            lines.append(f"DESCRIPTION:{_ics_escape(s.description)}")
        lines.append("END:VEVENT")

    lines.append("END:VCALENDAR")
    ics_text = "\r\n".join(lines) + "\r\n"

    return Response(
        content=ics_text,
        media_type="text/calendar",
        headers={
            "Content-Disposition": "attachment; filename=smartstudy_timetable.ics"
        },
    )


@router.get("/google/status/{user_id}")
def google_status(user_id: UUID, db: Session = Depends(get_db)):
    """Return whether the SmartStudy user has linked Google Calendar."""
    link = db.query(GoogleCalendarLink).filter(GoogleCalendarLink.user_id == user_id).first()
    return {
        "linked": bool(link),
        "has_previous_export": bool(link and link.calendar_id),
        "last_export_at": (link.last_export_at.isoformat() if link and link.last_export_at else None),
    }


def _creds_from_link(link: GoogleCalendarLink) -> Credentials:
    data = json.loads(link.credentials_json)
    creds = Credentials.from_authorized_user_info(data, scopes=data.get("scopes"))
    # Refresh if needed
    if creds.expired and creds.refresh_token:
        creds.refresh(GoogleRequest())
        # Persist refreshed creds
        link.credentials_json = creds.to_json()
    return creds


@router.post("/google/export/{user_id}")
def export_google_calendar(
    user_id: UUID,
    payload: ExportRequest,
    overwrite: bool = False,
    db: Session = Depends(get_db),
):
    """Export the timetable directly into the user's Google Calendar.

    Behavior:
      - If `overwrite=true` and a previous export exists, delete the previous
        exported calendar and recreate it.
      - If `overwrite=false`, append events to the existing exported calendar.
    """
    link = db.query(GoogleCalendarLink).filter(GoogleCalendarLink.user_id == user_id).first()
    if not link:
        raise HTTPException(status_code=401, detail="Google Calendar not linked. Please connect first.")

    creds = _creds_from_link(link)
    service = build("calendar", "v3", credentials=creds)

    # Determine user's timezone (default UTC). We use this to create RFC3339 timestamps
    # with an explicit offset, which Google Calendar requires.
    user = db.query(User).filter(User.id == user_id).first()
    tz_str = (user.timezone if user and user.timezone else "UTC")
    try:
        tzinfo = ZoneInfo(tz_str)
    except Exception:
        tz_str = "UTC"
        tzinfo = ZoneInfo("UTC")

    # Ensure an export calendar exists (and handle overwrite)
    if overwrite and link.calendar_id:
        try:
            service.calendars().delete(calendarId=link.calendar_id).execute()
        except Exception:
            # If delete fails (already deleted etc.), continue
            pass
        link.calendar_id = None

    if not link.calendar_id:
        cal = service.calendars().insert(body={
            "summary": "U PLAN Timetable",
            "description": "Exported study timetable from U PLAN",
        }).execute()
        link.calendar_id = cal.get("id")

    # Compute base week start (timezone-aware, Monday at 00:00 in user's tz)
    now = datetime.now(tzinfo)
    if payload.week_start:
        try:
            base_date = datetime.fromisoformat(payload.week_start).date()
        except Exception:
            raise HTTPException(status_code=400, detail="week_start must be in YYYY-MM-DD format")
        base = datetime(base_date.year, base_date.month, base_date.day, 0, 0, 0, tzinfo=tzinfo)
    else:
        base_naive = _monday_of_week(now.replace(tzinfo=None))
        base = datetime(base_naive.year, base_naive.month, base_naive.day, 0, 0, 0, tzinfo=tzinfo)

    inserted = 0
    for s in payload.sessions:
        title = (s.subject or "Study Session").strip() or "Study Session"
        sh, sm = _parse_hhmm(s.startTime)
        eh, em = _parse_hhmm(s.endTime)
        start_dt = base + timedelta(days=s.day, hours=sh, minutes=sm)
        end_dt = base + timedelta(days=s.day, hours=eh, minutes=em)
        if end_dt <= start_dt:
            continue

        # Google Calendar requires either an offset in RFC3339 or an explicit timeZone.
        event = {
            "summary": title,
            "description": s.description or "U PLAN exported session",
            "start": {"dateTime": start_dt.isoformat(), "timeZone": tz_str},
            "end": {"dateTime": end_dt.isoformat(), "timeZone": tz_str},
        }

        service.events().insert(calendarId=link.calendar_id, body=event).execute()
        inserted += 1

    link.last_export_at = datetime.utcnow()
    db.add(link)
    db.commit()

    calendar_url = None
    if link.calendar_id:
        calendar_url = f"https://calendar.google.com/calendar/u/0/r?cid={quote(link.calendar_id)}"

    return {
        "success": True,
        "exported_events": inserted,
        "calendar_id": link.calendar_id,
        "calendar_url": calendar_url,
        "overwrite": overwrite,
    }
