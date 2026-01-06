from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone, time
from typing import Any, Dict, List, Optional, Tuple

from fastapi import APIRouter, Depends, HTTPException, Header
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.study_session import StudySession
from app.models.study_timetable import StudyTimetable
from app.models.subject import Subject
from app.models.user_week_study_schedule import UserWeekStudySchedule
from app.models.user import User
from app.services.session_reminders import rebuild_upcoming_session_email_reminders


router = APIRouter(prefix="/study-timetables", tags=["Study Timetables"])


class StudyTimetableCreate(BaseModel):
    user_id: str
    name: str
    data: Dict[str, Any]
    is_active: Optional[bool] = True


class StudyTimetableUpdate(BaseModel):
    name: Optional[str] = None
    data: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None


class StudyTimetableApply(BaseModel):
    """Apply a saved timetable to create planned StudySession rows.

    - week_id: frontend week identifier (e.g. "2025-W45")
    - mode: overwrite replaces planned sessions for that week; merge inserts only non-overlapping slots
    - tz_offset_minutes: browser timezone offset (minutes east of UTC). Used to convert HH:MM+day into UTC datetimes.
    """

    week_id: str = "default"
    mode: str = "overwrite"  # overwrite | merge
    tz_offset_minutes: int = 0
    activate: bool = True


def _validate_uuid(value: str, field: str) -> None:
    try:
        uuid.UUID(value)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid {field} format")


def _serialize(t: StudyTimetable) -> Dict[str, Any]:
    return {
        "id": str(t.id),
        "user_id": str(t.user_id),
        "name": t.name,
        "is_active": bool(t.is_active),
        "created_at": t.created_at.isoformat() if t.created_at else None,
        "updated_at": t.updated_at.isoformat() if t.updated_at else None,
        "data": t.data or {},
    }


def _require_user(user_id: str, x_user_id: str) -> None:
    """Basic guard used across the API: header user must match the requested user."""
    if not x_user_id:
        raise HTTPException(status_code=401, detail="Missing X-User-Id header")
    if str(x_user_id) != str(user_id):
        raise HTTPException(status_code=403, detail="Forbidden")


def _require_owner(t: StudyTimetable, x_user_id: str) -> None:
    if not x_user_id:
        raise HTTPException(status_code=401, detail="Missing X-User-Id header")
    if str(t.user_id) != str(x_user_id):
        raise HTTPException(status_code=403, detail="Forbidden")


def _parse_hhmm(value: str) -> Tuple[int, int]:
    try:
        parts = (value or "").strip().split(":")
        if len(parts) != 2:
            raise ValueError
        h = int(parts[0])
        m = int(parts[1])
        if h < 0 or h > 23 or m < 0 or m > 59:
            raise ValueError
        return h, m
    except Exception:
        raise HTTPException(status_code=400, detail=f"Invalid time format: {value!r}. Expected HH:MM")


def _week_bounds_utc(tz_offset_minutes: int) -> Tuple[datetime, datetime, datetime]:
    """Return (week_start_utc, week_end_utc, monday_local_midnight_utc_ref).

    We compute a "local" week based on the provided tz offset.
    The monday_local_midnight_utc_ref is the UTC timestamp representing Monday 00:00 in local time.
    """
    offset = timedelta(minutes=int(tz_offset_minutes or 0))
    now_utc = datetime.now(timezone.utc)
    now_local = now_utc + offset
    monday_local = now_local.date() - timedelta(days=now_local.date().weekday())
    monday_local_midnight_utc = datetime.combine(monday_local, time.min).replace(tzinfo=timezone.utc) - offset
    week_start_utc = monday_local_midnight_utc
    week_end_utc = week_start_utc + timedelta(days=7)
    return week_start_utc, week_end_utc, monday_local_midnight_utc


def _overlaps(a_start: datetime, a_end: datetime, b_start: datetime, b_end: datetime) -> bool:
    return a_start < b_end and a_end > b_start


@router.get("/user/{user_id}")
def list_user_timetables(
    user_id: str,
    session: Session = Depends(get_db),
    x_user_id: str = Header(..., alias="X-User-Id"),
):
    _validate_uuid(user_id, "user_id")
    _require_user(user_id, x_user_id)
    timetables = (
        session.query(StudyTimetable)
        .filter(StudyTimetable.user_id == user_id)
        .order_by(StudyTimetable.created_at.desc())
        .all()
    )
    return {"timetables": [_serialize(t) for t in timetables]}


@router.get("/user/{user_id}/active")
def get_active_timetable(
    user_id: str,
    session: Session = Depends(get_db),
    x_user_id: str = Header(..., alias="X-User-Id"),
):
    _validate_uuid(user_id, "user_id")
    _require_user(user_id, x_user_id)
    t = (
        session.query(StudyTimetable)
        .filter(StudyTimetable.user_id == user_id, StudyTimetable.is_active == True)  # noqa: E712
        .order_by(StudyTimetable.updated_at.desc())
        .first()
    )
    if not t:
        return {"timetable": None}
    return {"timetable": _serialize(t)}


@router.post("")
def create_timetable(
    payload: StudyTimetableCreate,
    session: Session = Depends(get_db),
    x_user_id: str = Header(..., alias="X-User-Id"),
):
    _validate_uuid(payload.user_id, "user_id")
    _require_user(payload.user_id, x_user_id)

    user = session.query(User).filter(User.id == payload.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    desired_active = True if payload.is_active is None else bool(payload.is_active)

    # Deactivate any existing active timetable for this user
    if desired_active:
        session.query(StudyTimetable).filter(
            StudyTimetable.user_id == payload.user_id, StudyTimetable.is_active == True  # noqa: E712
        ).update({StudyTimetable.is_active: False})

    t = StudyTimetable(
        user_id=payload.user_id,
        name=payload.name,
        data=payload.data,
        is_active=desired_active,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    session.add(t)
    session.commit()
    session.refresh(t)

    # After applying/publishing a timetable, rebuild reminders for upcoming planned sessions.
    # (If sessions are created elsewhere during apply, this still safely dedupes.)
    if t.is_active:
        rebuild_upcoming_session_email_reminders(session, user_id=uuid.UUID(payload.user_id))
    return _serialize(t)


@router.put("/{timetable_id}")
def update_timetable(
    timetable_id: str,
    payload: StudyTimetableUpdate,
    session: Session = Depends(get_db),
    x_user_id: str = Header(..., alias="X-User-Id"),
):
    _validate_uuid(timetable_id, "timetable_id")
    t = session.query(StudyTimetable).filter(StudyTimetable.id == timetable_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Timetable not found")

    _require_owner(t, x_user_id)

    if payload.name is not None:
        t.name = payload.name
    if payload.data is not None:
        t.data = payload.data
    if payload.is_active is not None:
        if payload.is_active:
            # Deactivate others for the user
            session.query(StudyTimetable).filter(
                StudyTimetable.user_id == t.user_id, StudyTimetable.id != t.id
            ).update({StudyTimetable.is_active: False})
        t.is_active = payload.is_active

    t.updated_at = datetime.utcnow()
    session.commit()
    session.refresh(t)

    # If this update activates the timetable, rebuild reminders.
    if t.is_active:
        rebuild_upcoming_session_email_reminders(session, user_id=uuid.UUID(str(t.user_id)))
    return _serialize(t)


@router.post("/{timetable_id}/activate")
def activate_timetable(
    timetable_id: str,
    session: Session = Depends(get_db),
    x_user_id: str = Header(..., alias="X-User-Id"),
):
    _validate_uuid(timetable_id, "timetable_id")
    t = session.query(StudyTimetable).filter(StudyTimetable.id == timetable_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Timetable not found")

    _require_owner(t, x_user_id)

    session.query(StudyTimetable).filter(
        StudyTimetable.user_id == t.user_id, StudyTimetable.id != t.id
    ).update({StudyTimetable.is_active: False})

    t.is_active = True
    t.updated_at = datetime.utcnow()
    session.commit()
    session.refresh(t)

    # Activation is effectively a publish/apply event.
    rebuild_upcoming_session_email_reminders(session, user_id=uuid.UUID(str(t.user_id)))
    return _serialize(t)


@router.delete("/{timetable_id}")
def delete_timetable(
    timetable_id: str,
    session: Session = Depends(get_db),
    x_user_id: str = Header(..., alias="X-User-Id"),
):
    _validate_uuid(timetable_id, "timetable_id")
    t = session.query(StudyTimetable).filter(StudyTimetable.id == timetable_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Timetable not found")

    _require_owner(t, x_user_id)

    was_active = bool(t.is_active)
    user_id = str(t.user_id)
    session.delete(t)
    session.commit()

    # If deleted timetable was active, attempt to activate the newest one
    if was_active:
        newest = (
            session.query(StudyTimetable)
            .filter(StudyTimetable.user_id == user_id)
            .order_by(StudyTimetable.created_at.desc())
            .first()
        )
        if newest:
            newest.is_active = True
            newest.updated_at = datetime.utcnow()
            session.commit()

    return {"message": "Timetable deleted"}


@router.post("/{timetable_id}/apply")
def apply_timetable(
    timetable_id: str,
    payload: StudyTimetableApply,
    session: Session = Depends(get_db),
    x_user_id: str = Header(..., alias="X-User-Id"),
):
    """Apply a saved timetable by creating planned StudySession rows for the current local week.

    Deduping rules:
    - If a StudySession already exists for the same (start_at,end_at,subject_id), we skip it.
    - In merge mode, if the new slot overlaps an existing session, we skip it.
    - In overwrite mode, we delete existing unlocked planned sessions in the week before inserting.
    """

    _validate_uuid(timetable_id, "timetable_id")
    t = session.query(StudyTimetable).filter(StudyTimetable.id == timetable_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Timetable not found")
    _require_owner(t, x_user_id)

    mode = (payload.mode or "overwrite").strip().lower()
    if mode not in {"overwrite", "merge"}:
        raise HTTPException(status_code=400, detail="mode must be 'overwrite' or 'merge'")

    data: Dict[str, Any] = t.data or {}
    calendar_sessions = data.get("calendarSessions")
    if not isinstance(calendar_sessions, list) or not calendar_sessions:
        raise HTTPException(status_code=400, detail="Timetable has no calendarSessions data to apply")

    # Compute week bounds in UTC from the browser timezone offset
    week_start_utc, week_end_utc, monday_local_midnight_utc = _week_bounds_utc(int(payload.tz_offset_minutes or 0))

    user_uuid = uuid.UUID(str(t.user_id))

    # Load existing sessions in the target week range
    existing_sessions: List[StudySession] = (
        session.query(StudySession)
        .filter(StudySession.user_id == user_uuid)
        .filter(StudySession.start_at >= week_start_utc)
        .filter(StudySession.start_at < week_end_utc)
        .order_by(StudySession.start_at.asc())
        .all()
    )

    if mode == "overwrite":
        # Delete unlocked planned sessions in the week. Keep locked and non-planned rows.
        for s in existing_sessions:
            if s.status == "planned" and not bool(s.locked):
                session.delete(s)
        session.commit()
        existing_sessions = (
            session.query(StudySession)
            .filter(StudySession.user_id == user_uuid)
            .filter(StudySession.start_at >= week_start_utc)
            .filter(StudySession.start_at < week_end_utc)
            .order_by(StudySession.start_at.asc())
            .all()
        )

    # Map subject title -> subject_id for this user
    subjects = (
        session.query(Subject)
        .filter(Subject.user_id == user_uuid)
        .filter(Subject.is_active == True)  # noqa: E712
        .all()
    )
    subj_by_title = {str(s.title or "").strip().lower(): s for s in subjects}

    created = 0
    skipped_duplicates = 0
    skipped_overlaps = 0

    # Also keep the UI's per-week JSON schedule in sync
    def _normalize_ui_item(item: Dict[str, Any]) -> Dict[str, Any]:
        sid = str(item.get("id") or "").strip() or str(uuid.uuid4())
        return {
            "id": sid,
            "subject": str(item.get("subject") or "").strip(),
            "startTime": str(item.get("startTime") or "08:00"),
            "endTime": str(item.get("endTime") or "09:00"),
            "day": int(item.get("day") if item.get("day") is not None else 0),
            "type": item.get("type"),
            "color": item.get("color"),
            "deadline": item.get("deadline"),
        }

    normalized_ui = [
        _normalize_ui_item(s) for s in calendar_sessions if isinstance(s, dict)
    ]

    # Build sessions to insert
    for ui in normalized_ui:
        day_idx = int(ui.get("day") or 0)  # 0=Mon..6=Sun
        sh, sm = _parse_hhmm(str(ui.get("startTime") or "08:00"))
        eh, em = _parse_hhmm(str(ui.get("endTime") or "09:00"))

        # Convert local date+time to UTC
        start_at = monday_local_midnight_utc + timedelta(days=day_idx, hours=sh, minutes=sm)
        end_at = monday_local_midnight_utc + timedelta(days=day_idx, hours=eh, minutes=em)

        if end_at <= start_at:
            # Skip invalid sessions
            continue

        subject_title = str(ui.get("subject") or "").strip()
        subject_row = subj_by_title.get(subject_title.lower())
        subject_id = subject_row.id if subject_row else None

        # Dedup check: exact match in existing list
        is_dup = False
        for ex in existing_sessions:
            if ex.start_at == start_at and ex.end_at == end_at and ex.subject_id == subject_id:
                is_dup = True
                break
        if is_dup:
            skipped_duplicates += 1
            continue

        # Overlap check in merge mode
        if mode == "merge":
            has_overlap = any(_overlaps(start_at, end_at, ex.start_at, ex.end_at) for ex in existing_sessions)
            if has_overlap:
                skipped_overlaps += 1
                continue

        new_row = StudySession(
            user_id=user_uuid,
            subject_id=subject_id,
            source="generated",
            start_at=start_at,
            end_at=end_at,
            status="planned",
            locked=False,
            notes=None,
        )
        session.add(new_row)
        existing_sessions.append(new_row)
        created += 1

    # Save / merge the per-week UI schedule
    week_id = (payload.week_id or "default").strip() or "default"
    row = (
        session.query(UserWeekStudySchedule)
        .filter(UserWeekStudySchedule.user_id == str(user_uuid))
        .filter(UserWeekStudySchedule.week_id == week_id)
        .first()
    )
    if row is None:
        row = UserWeekStudySchedule(user_id=str(user_uuid), week_id=week_id, sessions=normalized_ui)
        session.add(row)
    else:
        if mode == "overwrite":
            row.sessions = normalized_ui
        else:
            existing_ui = row.sessions if isinstance(row.sessions, list) else []
            # Dedup by (day,startTime,endTime,subject)
            seen = {
                (int(s.get("day", 0)), str(s.get("startTime")), str(s.get("endTime")), str(s.get("subject")).strip().lower())
                for s in existing_ui
                if isinstance(s, dict)
            }
            merged = list(existing_ui)
            for s in normalized_ui:
                key = (int(s.get("day", 0)), str(s.get("startTime")), str(s.get("endTime")), str(s.get("subject")).strip().lower())
                if key in seen:
                    continue
                seen.add(key)
                merged.append(s)
            row.sessions = merged

    # Optionally activate the timetable
    if payload.activate:
        session.query(StudyTimetable).filter(
            StudyTimetable.user_id == t.user_id, StudyTimetable.id != t.id
        ).update({StudyTimetable.is_active: False})
        t.is_active = True
        t.updated_at = datetime.utcnow()

    session.commit()

    # Rebuild reminders (safe/deduped)
    rebuild_upcoming_session_email_reminders(session, user_id=user_uuid)

    return {
        "ok": True,
        "timetable_id": str(t.id),
        "week_id": week_id,
        "mode": mode,
        "created": created,
        "skipped_duplicates": skipped_duplicates,
        "skipped_overlaps": skipped_overlaps,
    }
