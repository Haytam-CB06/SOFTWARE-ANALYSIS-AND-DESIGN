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


router = APIRouter(prefix="/sessions", tags=["sessions"])


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
    return s


class SessionCompletedCreateIn(BaseModel):
    """Create a completed session (used by Goals & Achievements logging)."""

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


@router.post("/completed", response_model=SessionOut)
def create_completed_session(
    payload: SessionCompletedCreateIn,
    db: Session = Depends(get_db),
    x_user_id: str = Header(..., alias="X-User-Id"),
):
    _guard_user(payload.user_id, x_user_id, db)

    s = StudySession(
        user_id=payload.user_id,
        subject_id=payload.subject_id,
        source=payload.source,
        start_at=payload.start_at,
        end_at=payload.end_at,
        status="completed",
        locked=False,
        notes=payload.notes,
    )
    db.add(s)
    db.commit()
    db.refresh(s)
    return s


class SessionUpdateIn(BaseModel):
    user_id: UUID
    status: Optional[str] = None  # planned | completed | skipped | missed
    notes: Optional[str] = None
    locked: Optional[bool] = None

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        vv = v.strip().lower()
        if vv not in {"planned", "completed", "skipped", "missed"}:
            raise ValueError("status must be one of: planned, completed, skipped, missed")
        return vv


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
        s.status = payload.status
    if payload.notes is not None:
        s.notes = payload.notes
    if payload.locked is not None:
        s.locked = payload.locked

    db.add(s)
    db.commit()
    db.refresh(s)
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

    total = 0.0
    by_day: dict[str, float] = {}
    for s in rows:
        dur = (s.end_at - s.start_at).total_seconds() / 3600.0
        if dur < 0:
            continue
        total += dur
        k = s.start_at.date().isoformat()
        by_day[k] = by_day.get(k, 0.0) + dur

    return {
        "period_start": ps.isoformat(),
        "period_end": pe.isoformat(),
        "total_completed_hours": round(total, 2),
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
