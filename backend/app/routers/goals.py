from __future__ import annotations

from datetime import date, datetime, timedelta, timezone, time
from decimal import Decimal
from typing import Any, Dict, List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, Header, HTTPException, Query
from pydantic import BaseModel, field_validator
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.assessment import Assessment
from app.models.goals import Goal
from app.models.study_session import StudySession
from app.models.subject import Subject
from app.models.user import User
from app.models.user_achievement import UserAchievement
from app.models.achievement import Achievement
from app.services.achievements import evaluate_and_unlock_week_achievements


router = APIRouter(prefix="/goals", tags=["Goals"])


def _guard_user(user_id: str, x_user_id: str, session: Session) -> None:
    if not x_user_id or x_user_id != user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")
    u = session.query(User).filter(User.id == user_id).first()
    if not u:
        raise HTTPException(status_code=404, detail="User not found")


def _parse_date(v: Optional[str]) -> Optional[date]:
    if v is None:
        return None
    vv = (v or "").strip()
    if not vv:
        return None
    try:
        return date.fromisoformat(vv)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid date: {v}") from e



def _tz_offset_td(tz_offset_minutes: Optional[int]) -> timedelta:
    try:
        if tz_offset_minutes is None:
            return timedelta(0)
        return timedelta(minutes=int(tz_offset_minutes))
    except Exception:
        return timedelta(0)


def _period_to_utc_range(ps: date, pe: date, tz_offset_minutes: Optional[int]) -> tuple[datetime, datetime]:
    """Convert local date period [ps..pe] to UTC datetime range [start, end)."""
    off = _tz_offset_td(tz_offset_minutes)
    start_local = datetime.combine(ps, time.min, tzinfo=timezone.utc)
    end_local = datetime.combine(pe + timedelta(days=1), time.min, tzinfo=timezone.utc)
    # utc = local + offset (where JS offset is minutes to add to local to get UTC)
    return start_local + off, end_local + off

def _to_local_date(dt_value: datetime, tz_offset_minutes: Optional[int]) -> date:
    """Convert a datetime (assumed UTC) to a local date using JS tz offset minutes."""
    off = _tz_offset_td(tz_offset_minutes)
    try:
        if dt_value.tzinfo is None:
            dt_utc = dt_value.replace(tzinfo=timezone.utc)
        else:
            dt_utc = dt_value.astimezone(timezone.utc)
    except Exception:
        dt_utc = dt_value.replace(tzinfo=timezone.utc)
    local_dt = dt_utc - off  # local = utc - offset
    return local_dt.date()



def _default_week_period(today: Optional[date] = None) -> tuple[date, date]:
    # Monday..Sunday
    td = today or datetime.now(timezone.utc).date()
    start = td - timedelta(days=td.weekday())
    end = start + timedelta(days=6)
    return start, end


def _decimal_to_float(v: Any) -> float:
    if v is None:
        return 0.0
    try:
        return float(v)
    except Exception:
        return 0.0


class GoalCreateIn(BaseModel):
    user_id: str
    subject_id: Optional[str] = None
    period_start: Optional[str] = None  # YYYY-MM-DD
    period_end: Optional[str] = None
    target_hours: float
    weight: Optional[int] = None

    @field_validator("target_hours")
    @classmethod
    def _target_hours_positive(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("target_hours must be > 0")
        return v

    @field_validator("weight")
    @classmethod
    def _weight_range(cls, v: Optional[int]) -> Optional[int]:
        if v is None:
            return v
        if v < 1 or v > 5:
            raise ValueError("weight must be between 1 and 5")
        return v


class GoalUpdateIn(BaseModel):
    user_id: str
    target_hours: Optional[float] = None
    weight: Optional[int] = None
    period_start: Optional[str] = None
    period_end: Optional[str] = None
    subject_id: Optional[str] = None

    @field_validator("target_hours")
    @classmethod
    def _target_hours_positive_optional(cls, v: Optional[float]) -> Optional[float]:
        if v is None:
            return v
        if v <= 0:
            raise ValueError("target_hours must be > 0")
        return v

    @field_validator("weight")
    @classmethod
    def _weight_range_optional(cls, v: Optional[int]) -> Optional[int]:
        if v is None:
            return v
        if v < 1 or v > 5:
            raise ValueError("weight must be between 1 and 5")
        return v


class GoalOut(BaseModel):
    id: str
    user_id: str
    subject_id: Optional[str] = None
    subject_title: Optional[str] = None
    period_start: str
    period_end: str
    target_hours: float
    weight: Optional[int] = None


def _to_goal_out(g: Goal, subj_title: Optional[str] = None) -> GoalOut:
    return GoalOut(
        id=str(g.id),
        user_id=str(g.user_id),
        subject_id=str(g.subject_id) if g.subject_id else None,
        subject_title=subj_title,
        period_start=g.period_start.isoformat(),
        period_end=g.period_end.isoformat(),
        target_hours=_decimal_to_float(g.target_hours),
        weight=int(g.weight) if g.weight is not None else None,
    )


@router.get("", response_model=dict)
def list_goals(
    user_id: str,
    period_start: Optional[str] = Query(default=None),
    period_end: Optional[str] = Query(default=None),
    tz_offset_minutes: Optional[int] = Query(default=None),
    session: Session = Depends(get_db),
    x_user_id: str = Header(..., alias="X-User-Id"),
):
    _guard_user(user_id, x_user_id, session)

    ps = _parse_date(period_start)
    pe = _parse_date(period_end)
    if ps is None or pe is None:
        ps, pe = _default_week_period()

    rows = (
        session.query(Goal, Subject)
        .outerjoin(Subject, Goal.subject_id == Subject.id)
        .filter(Goal.user_id == user_id, Goal.period_start == ps, Goal.period_end == pe)
        .order_by(Goal.subject_id.is_(None).desc(), Goal.weight.desc())
        .all()
    )

    out: List[Dict[str, Any]] = []
    for g, s in rows:
        title = (getattr(s, "title", None) or getattr(s, "name", None)) if s else None
        out.append(_to_goal_out(g, title).model_dump())
    return {"goals": out, "period_start": ps.isoformat(), "period_end": pe.isoformat()}


@router.post("", response_model=dict)
def upsert_goal(
    payload: GoalCreateIn,
    session: Session = Depends(get_db),
    x_user_id: str = Header(..., alias="X-User-Id"),
):
    _guard_user(payload.user_id, x_user_id, session)

    ps = _parse_date(payload.period_start)
    pe = _parse_date(payload.period_end)
    if ps is None or pe is None:
        ps, pe = _default_week_period()

    subj_id: Optional[UUID] = None
    if payload.subject_id:
        try:
            subj_id = UUID(payload.subject_id)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid subject_id")
        # Verify subject belongs to user
        subj = session.query(Subject).filter(Subject.id == str(subj_id), Subject.user_id == payload.user_id).first()
        if not subj:
            raise HTTPException(status_code=400, detail="Subject not found for this user")

    # Upsert via unique constraint
    existing = (
        session.query(Goal)
        .filter(
            Goal.user_id == payload.user_id,
            Goal.subject_id == (str(subj_id) if subj_id else None),
            Goal.period_start == ps,
            Goal.period_end == pe,
        )
        .first()
    )
    if existing:
        existing.target_hours = Decimal(str(payload.target_hours))
        existing.weight = payload.weight
        session.add(existing)
        session.commit()
        session.refresh(existing)
        subj_title = None
        if existing.subject_id:
            s = session.query(Subject).filter(Subject.id == existing.subject_id).first()
            subj_title = (getattr(s, "title", None) or getattr(s, "name", None)) if s else None
        return {"goal": _to_goal_out(existing, subj_title).model_dump()}

    g = Goal(
        user_id=payload.user_id,
        subject_id=str(subj_id) if subj_id else None,
        period_start=ps,
        period_end=pe,
        target_hours=Decimal(str(payload.target_hours)),
        weight=payload.weight,
    )
    session.add(g)
    try:
        session.commit()
    except IntegrityError:
        session.rollback()
        # If we raced, retry read and update.
        existing = (
            session.query(Goal)
            .filter(
                Goal.user_id == payload.user_id,
                Goal.subject_id == (str(subj_id) if subj_id else None),
                Goal.period_start == ps,
                Goal.period_end == pe,
            )
            .first()
        )
        if not existing:
            raise
        existing.target_hours = Decimal(str(payload.target_hours))
        existing.weight = payload.weight
        session.add(existing)
        session.commit()
        session.refresh(existing)
        subj_title = None
        if existing.subject_id:
            s = session.query(Subject).filter(Subject.id == existing.subject_id).first()
            subj_title = (getattr(s, "title", None) or getattr(s, "name", None)) if s else None
        return {"goal": _to_goal_out(existing, subj_title).model_dump()}

    session.refresh(g)
    subj_title = None
    if g.subject_id:
        s = session.query(Subject).filter(Subject.id == g.subject_id).first()
        subj_title = (getattr(s, "title", None) or getattr(s, "name", None)) if s else None
    return {"goal": _to_goal_out(g, subj_title).model_dump()}


@router.patch("/{goal_id}", response_model=dict)
def update_goal(
    goal_id: str,
    payload: GoalUpdateIn,
    session: Session = Depends(get_db),
    x_user_id: str = Header(..., alias="X-User-Id"),
):
    _guard_user(payload.user_id, x_user_id, session)

    g = session.query(Goal).filter(Goal.id == goal_id, Goal.user_id == payload.user_id).first()
    if not g:
        raise HTTPException(status_code=404, detail="Goal not found")

    if payload.target_hours is not None:
        g.target_hours = Decimal(str(payload.target_hours))
    if payload.weight is not None:
        g.weight = payload.weight

    if payload.period_start is not None:
        g.period_start = _parse_date(payload.period_start) or g.period_start
    if payload.period_end is not None:
        g.period_end = _parse_date(payload.period_end) or g.period_end

    if payload.subject_id is not None:
        if payload.subject_id == "":
            g.subject_id = None
        else:
            try:
                sid = UUID(payload.subject_id)
            except Exception:
                raise HTTPException(status_code=400, detail="Invalid subject_id")
            subj = session.query(Subject).filter(Subject.id == str(sid), Subject.user_id == payload.user_id).first()
            if not subj:
                raise HTTPException(status_code=400, detail="Subject not found for this user")
            g.subject_id = str(sid)

    session.add(g)
    session.commit()
    session.refresh(g)
    subj_title = None
    if g.subject_id:
        s = session.query(Subject).filter(Subject.id == g.subject_id).first()
        subj_title = (getattr(s, "title", None) or getattr(s, "name", None)) if s else None
    return {"goal": _to_goal_out(g, subj_title).model_dump()}


@router.delete("/{goal_id}", response_model=dict)
def delete_goal(
    goal_id: str,
    user_id: str,
    session: Session = Depends(get_db),
    x_user_id: str = Header(..., alias="X-User-Id"),
):
    _guard_user(user_id, x_user_id, session)

    g = session.query(Goal).filter(Goal.id == goal_id, Goal.user_id == user_id).first()
    if not g:
        raise HTTPException(status_code=404, detail="Goal not found")
    session.delete(g)
    session.commit()
    return {"ok": True}


@router.get("/summary", response_model=dict)
def goals_summary(
    user_id: str,
    period_start: Optional[str] = Query(default=None),
    period_end: Optional[str] = Query(default=None),
    tz_offset_minutes: Optional[int] = Query(default=None),
    session: Session = Depends(get_db),
    x_user_id: str = Header(..., alias="X-User-Id"),
):
    """Return a detailed weekly summary used by the Goals & Achievements page.

    - Completed study hours are computed from StudySession rows with status='completed'
    - Task completion is computed from Assessment.is_completed/completed_at
    """
    _guard_user(user_id, x_user_id, session)

    ps = _parse_date(period_start)
    pe = _parse_date(period_end)
    if ps is None or pe is None:
        ps, pe = _default_week_period()

    start_dt, end_dt = _period_to_utc_range(ps, pe, tz_offset_minutes)

    # Goals for period
    goals_rows = (
        session.query(Goal, Subject)
        .outerjoin(Subject, Goal.subject_id == Subject.id)
        .filter(Goal.user_id == user_id, Goal.period_start == ps, Goal.period_end == pe)
        .all()
    )

    goals_out: List[Dict[str, Any]] = []
    target_total = 0.0
    target_by_subject: Dict[str, float] = {}
    for g, s in goals_rows:
        subj_title = (getattr(s, "title", None) or getattr(s, "name", None)) if s else None
        go = _to_goal_out(g, subj_title).model_dump()
        goals_out.append(go)
        th = _decimal_to_float(g.target_hours)
        target_total += th
        if g.subject_id:
            target_by_subject[str(g.subject_id)] = target_by_subject.get(str(g.subject_id), 0.0) + th

    # Completed study sessions within period
    sess_rows = (
        session.query(StudySession)
        .filter(
            StudySession.user_id == user_id,
            StudySession.status == "completed",
            StudySession.start_at >= start_dt,
            StudySession.start_at < end_dt,
        )
        .all()
    )

    completed_total = 0.0
    completed_by_subject: Dict[str, float] = {}
    completed_by_day: Dict[str, float] = {}  # YYYY-MM-DD -> hours
    for s in sess_rows:
        seconds = (
            float(s.actual_duration_seconds)
            if getattr(s, 'actual_duration_seconds', None) is not None
            else float((s.end_at - s.start_at).total_seconds())
        )
        if seconds < 0:
            continue
        dur = seconds / 3600.0
        completed_total += dur
        if s.subject_id:
            completed_by_subject[str(s.subject_id)] = completed_by_subject.get(str(s.subject_id), 0.0) + dur
        day_key = _to_local_date(s.start_at, tz_offset_minutes).isoformat()
        completed_by_day[day_key] = completed_by_day.get(day_key, 0.0) + dur

    # Streak: consecutive days ending today (UTC) with >= 0.25h completed
    today = datetime.now(timezone.utc).date()
    streak = 0
    cursor = today
    while True:
        k = cursor.isoformat()
        if completed_by_day.get(k, 0.0) >= 0.25:
            streak += 1
            cursor = cursor - timedelta(days=1)
            continue
        break

    # Assessments/tasks
    # Upcoming deadlines
    now = datetime.now(timezone.utc)
    upcoming = (
        session.query(Assessment, Subject)
        .join(Subject, Assessment.subject_id == Subject.id)
        .filter(
            Subject.user_id == user_id,
            Assessment.is_completed == False,  # noqa: E712
            Assessment.due_at >= now,
        )
        .order_by(Assessment.due_at.asc())
        .limit(5)
        .all()
    )
    upcoming_out: List[Dict[str, Any]] = []
    for a, subj in upcoming:
        upcoming_out.append(
            {
                "id": str(a.id),
                "title": a.title,
                "type": a.kind,
                "dueDate": a.due_at.isoformat(),
                "subject": (getattr(subj, "title", None) or getattr(subj, "name", None) or "").strip() or "(Untitled)",
            }
        )

    # Completed tasks in period (by completed_at if present)
    completed_tasks = 0
    if hasattr(Assessment, "completed_at"):
        completed_tasks = (
            session.query(Assessment, Subject)
            .join(Subject, Assessment.subject_id == Subject.id)
            .filter(
                Subject.user_id == user_id,
                Assessment.is_completed == True,  # noqa: E712
                Assessment.completed_at.isnot(None),
                Assessment.completed_at >= start_dt,
                Assessment.completed_at < end_dt,
            )
            .count()
        )
    # Achievements (persisted)
    # Unlock any newly earned achievements for this week.
    try:
        evaluate_and_unlock_week_achievements(session, UUID(user_id), ps, pe)
    except Exception:
        # best-effort; never break summary
        pass

    achievements: List[Dict[str, Any]] = []
    try:
        # Prefer achievements unlocked within the current period; if none, show last few unlocked overall.
        q = (
            session.query(UserAchievement, Achievement)
            .join(Achievement, UserAchievement.achievement_code == Achievement.code)
            .filter(UserAchievement.user_id == UUID(user_id))
        )
        in_week = (
            q.filter(UserAchievement.unlocked_at >= start_dt, UserAchievement.unlocked_at < end_dt)
            .order_by(UserAchievement.unlocked_at.desc())
            .all()
        )
        rows = in_week
        if not rows:
            rows = q.order_by(UserAchievement.unlocked_at.desc()).limit(3).all()
        for ua, a in rows:
            achievements.append({
                'key': a.code,
                'title': a.title,
                'detail': a.description,
                'unlocked_at': ua.unlocked_at.isoformat() if ua.unlocked_at else None,
            })
    except Exception:
        achievements = []

    # Per-subject rollup with subject titles
    subj_titles: Dict[str, str] = {}
    subj_ids = set(list(target_by_subject.keys()) + list(completed_by_subject.keys()))
    if subj_ids:
        subs = session.query(Subject).filter(Subject.user_id == user_id, Subject.id.in_(list(subj_ids))).all()
        for s in subs:
            subj_titles[str(s.id)] = (getattr(s, "title", None) or getattr(s, "name", None) or "").strip() or "(Untitled)"

    subjects_out: List[Dict[str, Any]] = []
    for sid in sorted(subj_ids):
        subjects_out.append(
            {
                "subject_id": sid,
                "subject_title": subj_titles.get(sid),
                "target_hours": round(target_by_subject.get(sid, 0.0), 2),
                "completed_hours": round(completed_by_subject.get(sid, 0.0), 2),
            }
        )

    return {
        "period_start": ps.isoformat(),
        "period_end": pe.isoformat(),
        "total_target_hours": round(target_total, 2),
        "total_completed_hours": round(completed_total, 2),
        "streak_days": streak,
        "completed_tasks": completed_tasks,
        "goals": goals_out,
        "subjects": subjects_out,
        "upcoming_deadlines": upcoming_out,
        "achievements": achievements,
    }
