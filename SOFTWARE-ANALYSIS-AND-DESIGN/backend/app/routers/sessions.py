from __future__ import annotations

from datetime import date, datetime, time, timedelta, timezone
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Header
from pydantic import BaseModel, field_validator
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.study_session import StudySession
from app.models.user import User
from app.services.session_reminders import rebuild_upcoming_session_email_reminders
from app.services.achievements import evaluate_and_unlock_week_achievements


router = APIRouter(prefix="/sessions", tags=["sessions"])


def _utc_start_of_today() -> datetime:
    now = datetime.now(timezone.utc)
    return datetime.combine(now.date(), time.min).replace(tzinfo=timezone.utc)


def _guard_user(user_id: UUID, x_user_id: str, db: Session) -> None:
    if not x_user_id or x_user_id != str(user_id):
        raise HTTPException(status_code=401, detail="Unauthorized")
    u = db.query(User).filter(User.id == str(user_id)).first()
    if not u:
        raise HTTPException(status_code=404, detail="User not found")


class SessionCreateIn(BaseModel):
    user_id: UUID
    subject_id: Optional[UUID] = None
    start_at: datetime
    end_at: datetime
    source: str = "manual"  # manual | generated | edited
    notes: Optional[str] = None

    @field_validator("end_at")
    @classmethod
    def end_after_start(cls, v: datetime, info):
        start = info.data.get("start_at")
        if start and v <= start:
            raise ValueError("end_at must be after start_at")
        return v


class SessionOut(BaseModel):
    id: UUID
    user_id: UUID
    subject_id: Optional[UUID] = None
    source: str
    start_at: datetime
    end_at: datetime
    status: str
    actual_duration_seconds: Optional[int] = None
    locked: bool
    notes: Optional[str] = None

    model_config = {"from_attributes": True}


@router.post("/", response_model=SessionOut)
def create_session(payload: SessionCreateIn, db: Session = Depends(get_db)):
    s = StudySession(
        user_id=payload.user_id,
        subject_id=payload.subject_id,
        source=payload.source,
        start_at=payload.start_at,
        end_at=payload.end_at,
        status="planned",
        locked=False,
        notes=payload.notes,
    )
    db.add(s)
    db.commit()
    db.refresh(s)

    # If a timetable/apply flow creates sessions via this endpoint, ensure email reminders exist.
    # Safe to call multiple times (dedupes inside the service).
    try:
        rebuild_upcoming_session_email_reminders(db, user_id=payload.user_id)
    except Exception:
        # Do not block session creation on reminder rebuild errors.
        pass
    return s


class SessionCompletedCreateIn(BaseModel):
    """Create a completed session (used by Goals & Achievements logging)."""

    user_id: UUID
    subject_id: Optional[UUID] = None
    start_at: datetime
    end_at: datetime
    source: str = "manual"  # manual | generated | edited
    notes: Optional[str] = None
    actual_duration_seconds: Optional[int] = None

    @field_validator("end_at")
    @classmethod
    def end_after_start(cls, v: datetime, info):
        start = info.data.get("start_at")
        if start and v <= start:
            raise ValueError("end_at must be after start_at")
        return v


@router.post("/completed", response_model=SessionOut)
def create_completed_session(
    payload: SessionCompletedCreateIn,
    db: Session = Depends(get_db),
    x_user_id: str = Header(..., alias="X-User-Id"),
):
    _guard_user(payload.user_id, x_user_id, db)

    # Prevent double counting:
    # If a matching planned timetable session exists, convert it to completed
    # instead of creating a new completed row.
    # Match window: within 5 minutes start/end, and subject_id aligns.
    start_lo = payload.start_at - timedelta(minutes=5)
    start_hi = payload.start_at + timedelta(minutes=5)
    end_lo = payload.end_at - timedelta(minutes=5)
    end_hi = payload.end_at + timedelta(minutes=5)

    candidates = (
        db.query(StudySession)
        .filter(
            StudySession.user_id == payload.user_id,
            StudySession.status == "planned",
            StudySession.start_at >= start_lo,
            StudySession.start_at <= start_hi,
            StudySession.end_at >= end_lo,
            StudySession.end_at <= end_hi,
        )
        .all()
    )
    for cand in candidates:
        if (payload.subject_id is None) != (cand.subject_id is None):
            continue
        if payload.subject_id is not None and cand.subject_id != payload.subject_id:
            continue
        cand.status = "completed"
        cand.actual_duration_seconds = (
            int(payload.actual_duration_seconds)
            if payload.actual_duration_seconds is not None
            else int(max(0, (payload.end_at - payload.start_at).total_seconds()))
        )
        if payload.notes is not None:
            cand.notes = payload.notes
        db.add(cand)
        db.commit()
        db.refresh(cand)
        try:
            evaluate_and_unlock_week_achievements(db, payload.user_id)
        except Exception:
            pass
        return cand

    # Manual logging must match a planned timetable slot. If it doesn't, reject.
    if (payload.source or "").strip().lower() == "manual":
        raise HTTPException(
            status_code=400,
            detail="Manual session logging is only allowed for an existing planned timetable slot."
        )

    s = StudySession(
        user_id=payload.user_id,
        subject_id=payload.subject_id,
        source=payload.source,
        start_at=payload.start_at,
        end_at=payload.end_at,
        status="completed",
        actual_duration_seconds=(
            int(payload.actual_duration_seconds)
            if payload.actual_duration_seconds is not None
            else int(max(0, (payload.end_at - payload.start_at).total_seconds()))
        ),
        locked=False,
        notes=payload.notes,
    )
    db.add(s)
    db.commit()
    db.refresh(s)
    try:
        evaluate_and_unlock_week_achievements(db, payload.user_id)
    except Exception:
        pass
    return s


class SessionUpdateIn(BaseModel):
    user_id: UUID
    status: Optional[str] = None  # planned | completed | skipped | missed
    actual_duration_seconds: Optional[int] = None
    notes: Optional[str] = None
    locked: Optional[bool] = None

    @field_validator("actual_duration_seconds")
    @classmethod
    def validate_actual_seconds(cls, v: Optional[int]) -> Optional[int]:
        if v is None:
            return v
        if v < 0:
            raise ValueError("actual_duration_seconds must be >= 0")
        return v

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        vv = v.strip().lower()
        if vv not in {"planned", "completed", "skipped", "missed"}:
            raise ValueError("status must be one of: planned, completed, skipped, missed")
        return vv


@router.get("/by-day", response_model=List[SessionOut])
def list_sessions_by_day(
    user_id: UUID,
    day: str = Query(..., description="YYYY-MM-DD in UTC"),
    db: Session = Depends(get_db),
    x_user_id: str = Header(..., alias="X-User-Id"),
):
    """List all sessions for a single UTC day.

    Used by manual logging UI to show the timetable slots for that day.
    """
    _guard_user(user_id, x_user_id, db)
    try:
        d = date.fromisoformat((day or "").strip())
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid day. Use YYYY-MM-DD")

    start_dt = datetime.combine(d, time.min).replace(tzinfo=timezone.utc)
    end_dt = start_dt + timedelta(days=1)

    rows = (
        db.query(StudySession)
        .filter(
            StudySession.user_id == user_id,
            StudySession.start_at >= start_dt,
            StudySession.start_at < end_dt,
        )
        .order_by(StudySession.start_at.asc())
        .all()
    )
    return rows


class FinalizeMissedIn(BaseModel):
    user_id: UUID


@router.post("/finalize-missed", response_model=dict)
def finalize_missed_after_midnight(
    payload: FinalizeMissedIn,
    db: Session = Depends(get_db),
    x_user_id: str = Header(..., alias="X-User-Id"),
):
    """Mark any planned sessions from previous days as missed + lock them.

    This is designed to be callable by a cron/job hook.
    """
    _guard_user(payload.user_id, x_user_id, db)
    cutoff = _utc_start_of_today()
    q = (
        db.query(StudySession)
        .filter(
            StudySession.user_id == payload.user_id,
            StudySession.status == "planned",
            StudySession.end_at < cutoff,
        )
    )
    rows = q.all()
    count = 0
    for s in rows:
        s.status = "missed"
        s.locked = True
        s.actual_duration_seconds = None
        db.add(s)
        count += 1
    db.commit()
    return {"finalized_missed": count}


@router.patch("/{session_id}", response_model=SessionOut)
def update_session(
    session_id: UUID,
    payload: SessionUpdateIn,
    db: Session = Depends(get_db),
    x_user_id: str = Header(..., alias="X-User-Id"),
):
    _guard_user(payload.user_id, x_user_id, db)

    s = db.query(StudySession).filter(StudySession.id == session_id, StudySession.user_id == payload.user_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Session not found")

    if payload.status is not None:
        next_status = payload.status

        # Enforce completion rules:
        # - Completed can only be set for a session that belongs to today (UTC).
        # - Skipped can never be completed.
        # - "Missed" sessions from *today* may still be completed manually (same-day catch-up).
        if next_status == "completed":
            if s.locked:
                raise HTTPException(status_code=400, detail="Session is locked")
            cur = (s.status or "").lower()
            if cur == "skipped":
                raise HTTPException(status_code=400, detail="Skipped sessions cannot be completed")
            if cur not in {"planned", "missed"}:
                raise HTTPException(status_code=400, detail="Only planned/missed sessions can be completed")
            if s.end_at < _utc_start_of_today():
                raise HTTPException(
                    status_code=400,
                    detail="This session is from a previous day and cannot be logged anymore. It is missed after midnight.",
                )

            s.status = "completed"
            # If caller didn't pass actual_duration_seconds, store planned interval.
            if payload.actual_duration_seconds is None:
                s.actual_duration_seconds = int(max(0, (s.end_at - s.start_at).total_seconds()))
        else:
            s.status = next_status
            # If session is being moved back to planned/skipped/missed, clear actual.
            if next_status in {"planned", "skipped", "missed"}:
                s.actual_duration_seconds = None
            # Lock missed sessions once they're in the past (prevents later edits/claims).
            if next_status == "missed" and s.end_at < _utc_start_of_today():
                s.locked = True
    if payload.actual_duration_seconds is not None:
        s.actual_duration_seconds = payload.actual_duration_seconds
    if payload.notes is not None:
        s.notes = payload.notes
    if payload.locked is not None:
        s.locked = payload.locked

    db.add(s)
    db.commit()
    db.refresh(s)
    if (payload.status or "").strip().lower() == "completed":
        try:
            evaluate_and_unlock_week_achievements(db, payload.user_id)
        except Exception:
            pass
    return s


@router.get("/summary", response_model=dict)
def sessions_summary(
    user_id: UUID,
    period_start: Optional[str] = Query(default=None),
    period_end: Optional[str] = Query(default=None),
    db: Session = Depends(get_db),
    x_user_id: str = Header(..., alias="X-User-Id"),
):
    """Return total completed hours + per-day breakdown for a date range."""
    _guard_user(user_id, x_user_id, db)

    def parse_d(v: Optional[str]) -> Optional[date]:
        if v is None:
            return None
        vv = (v or "").strip()
        if not vv:
            return None
        return date.fromisoformat(vv)

    ps = parse_d(period_start)
    pe = parse_d(period_end)
    if ps is None or pe is None:
        td = datetime.now(timezone.utc).date()
        ps = td - timedelta(days=td.weekday())
        pe = ps + timedelta(days=6)

    start_dt = datetime.combine(ps, time.min).replace(tzinfo=timezone.utc)
    end_dt = datetime.combine(pe + timedelta(days=1), time.min).replace(tzinfo=timezone.utc)

    rows = (
        db.query(StudySession)
        .filter(
            StudySession.user_id == user_id,
            StudySession.status == "completed",
            StudySession.start_at >= start_dt,
            StudySession.start_at < end_dt,
        )
        .all()
    )

    total_hours = 0.0
    by_day: dict[str, float] = {}
    for s in rows:
        seconds = (
            float(s.actual_duration_seconds)
            if getattr(s, "actual_duration_seconds", None) is not None
            else float((s.end_at - s.start_at).total_seconds())
        )
        if seconds < 0:
            continue
        dur_hours = seconds / 3600.0
        total_hours += dur_hours
        k = s.start_at.date().isoformat()
        by_day[k] = by_day.get(k, 0.0) + dur_hours

    return {
        "period_start": ps.isoformat(),
        "period_end": pe.isoformat(),
        "total_completed_hours": round(total_hours, 2),
        "by_day": {k: round(v, 2) for k, v in sorted(by_day.items())},
    }


@router.get("/", response_model=List[SessionOut])
def list_sessions(
    user_id: Optional[UUID] = Query(default=None),
    limit: int = Query(default=50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    q = db.query(StudySession)
    if user_id is not None:
        q = q.filter(StudySession.user_id == user_id)
    return q.order_by(StudySession.start_at.desc()).limit(limit).all()


@router.get("/{session_id}", response_model=SessionOut)
def get_session(session_id: UUID, db: Session = Depends(get_db)):
    s = db.query(StudySession).filter(StudySession.id == session_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Session not found")
    return s
