from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime, time, timedelta, timezone
from typing import Dict, List, Optional, Tuple
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.achievement import Achievement
from app.models.user_achievement import UserAchievement
from app.models.goals import Goal
from app.models.study_session import StudySession
from app.models.assessment import Assessment
from app.models.subject import Subject


@dataclass(frozen=True)
class AchievementDef:
    code: str
    title: str
    description: str
    points: int = 0


DEFAULT_ACHIEVEMENTS: List[AchievementDef] = [
    AchievementDef(
        code="weekly_goal",
        title="Weekly goal achieved",
        description="Hit your total target study hours for the week.",
        points=50,
    ),
    AchievementDef(
        code="streak_3",
        title="3-day streak",
        description="Studied at least 15 minutes per day for 3 days.",
        points=10,
    ),
    AchievementDef(
        code="streak_7",
        title="7-day streak",
        description="Studied at least 15 minutes per day for 7 days.",
        points=25,
    ),
    AchievementDef(
        code="tasks_3",
        title="Deadline crusher",
        description="Completed 3 assessments in a week.",
        points=15,
    ),
    AchievementDef(
        code="hours_10_week",
        title="10-hour week",
        description="Studied 10 hours in a single week.",
        points=20,
    ),
]


def ensure_default_achievements(db: Session) -> None:
    """Seed the achievements table with default definitions (idempotent)."""
    existing = {a.code for a in db.query(Achievement).all()}
    for d in DEFAULT_ACHIEVEMENTS:
        if d.code in existing:
            continue
        db.add(Achievement(code=d.code, title=d.title, description=d.description, points=d.points))
    db.commit()


def default_week_period(today: Optional[date] = None) -> Tuple[date, date]:
    td = today or datetime.now(timezone.utc).date()
    start = td - timedelta(days=td.weekday())
    end = start + timedelta(days=6)
    return start, end


def _range_dt(ps: date, pe: date) -> Tuple[datetime, datetime]:
    start_dt = datetime.combine(ps, time.min).replace(tzinfo=timezone.utc)
    end_dt = datetime.combine(pe + timedelta(days=1), time.min).replace(tzinfo=timezone.utc)
    return start_dt, end_dt


def compute_week_progress(
    db: Session,
    user_id: UUID,
    period_start: Optional[date] = None,
    period_end: Optional[date] = None,
) -> Dict[str, object]:
    """Compute weekly totals used across Dashboard / Goals / Workspace.

    Returns: {
      period_start, period_end,
      total_completed_hours,
      streak_days,
      completed_tasks,
      total_target_hours
    }
    """
    ps, pe = (period_start, period_end)
    if ps is None or pe is None:
        ps, pe = default_week_period()

    start_dt, end_dt = _range_dt(ps, pe)

    # Goals
    goals_rows = (
        db.query(Goal)
        .filter(Goal.user_id == str(user_id), Goal.period_start == ps, Goal.period_end == pe)
        .all()
    )
    total_target_hours = 0.0
    for g in goals_rows:
        try:
            total_target_hours += float(g.target_hours)
        except Exception:
            pass

    # Completed sessions
    sess_rows = (
        db.query(StudySession)
        .filter(
            StudySession.user_id == user_id,
            StudySession.status == "completed",
            StudySession.start_at >= start_dt,
            StudySession.start_at < end_dt,
        )
        .all()
    )

    completed_total = 0.0
    completed_by_day: Dict[str, float] = {}
    for s in sess_rows:
        seconds = (
            float(s.actual_duration_seconds)
            if getattr(s, "actual_duration_seconds", None) is not None
            else float((s.end_at - s.start_at).total_seconds())
        )
        if seconds < 0:
            continue
        hours = seconds / 3600.0
        completed_total += hours
        k = s.start_at.date().isoformat()
        completed_by_day[k] = completed_by_day.get(k, 0.0) + hours

    # Streak: consecutive days ending today with >= 0.25h
    today = datetime.now(timezone.utc).date()
    streak = 0
    cursor = today
    while True:
        if completed_by_day.get(cursor.isoformat(), 0.0) >= 0.25:
            streak += 1
            cursor = cursor - timedelta(days=1)
            continue
        break

    # Completed tasks in period
    completed_tasks = 0
    if hasattr(Assessment, "completed_at"):
        completed_tasks = (
            db.query(Assessment, Subject)
            .join(Subject, Assessment.subject_id == Subject.id)
            .filter(
                Subject.user_id == str(user_id),
                Assessment.is_completed == True,  # noqa: E712
                Assessment.completed_at.isnot(None),
                Assessment.completed_at >= start_dt,
                Assessment.completed_at < end_dt,
            )
            .count()
        )

    return {
        "period_start": ps,
        "period_end": pe,
        "total_completed_hours": float(round(completed_total, 2)),
        "streak_days": int(streak),
        "completed_tasks": int(completed_tasks),
        "total_target_hours": float(round(total_target_hours, 2)),
    }


def evaluate_and_unlock_week_achievements(
    db: Session,
    user_id: UUID,
    period_start: Optional[date] = None,
    period_end: Optional[date] = None,
) -> List[UserAchievement]:
    """Evaluate achievement criteria for a week and unlock any newly earned.

    Idempotent via unique constraint.
    """
    ensure_default_achievements(db)

    p = compute_week_progress(db, user_id, period_start, period_end)
    ps: date = p["period_start"]  # type: ignore
    pe: date = p["period_end"]  # type: ignore

    total_completed = float(p["total_completed_hours"])  # type: ignore
    streak = int(p["streak_days"])  # type: ignore
    completed_tasks = int(p["completed_tasks"])  # type: ignore
    total_target = float(p["total_target_hours"])  # type: ignore

    earned: List[str] = []
    if total_target > 0 and total_completed >= total_target:
        earned.append("weekly_goal")
    if streak >= 3:
        earned.append("streak_3")
    if streak >= 7:
        earned.append("streak_7")
    if completed_tasks >= 3:
        earned.append("tasks_3")
    if total_completed >= 10.0:
        earned.append("hours_10_week")

    if not earned:
        return []

    existing = {
        ua.achievement_code
        for ua in db.query(UserAchievement)
        .filter(UserAchievement.user_id == user_id, UserAchievement.achievement_code.in_(earned))
        .all()
    }

    new_rows: List[UserAchievement] = []
    for code in earned:
        if code in existing:
            continue
        ua = UserAchievement(user_id=user_id, achievement_code=code)
        db.add(ua)
        new_rows.append(ua)

    if new_rows:
        db.commit()
        for ua in new_rows:
            db.refresh(ua)

    return new_rows


def list_user_achievements(
    db: Session,
    user_id: UUID,
) -> List[dict]:
    """Return user's unlocked achievements with metadata."""
    ensure_default_achievements(db)
    rows = (
        db.query(UserAchievement, Achievement)
        .join(Achievement, UserAchievement.achievement_code == Achievement.code)
        .filter(UserAchievement.user_id == user_id)
        .order_by(UserAchievement.unlocked_at.desc())
        .all()
    )
    out: List[dict] = []
    for ua, a in rows:
        out.append(
            {
                "code": a.code,
                "title": a.title,
                "description": a.description,
                "points": a.points,
                "unlocked_at": ua.unlocked_at.isoformat() if ua.unlocked_at else None,
            }
        )
    return out


def list_all_achievements(db: Session) -> List[dict]:
    ensure_default_achievements(db)
    rows = db.query(Achievement).order_by(Achievement.points.desc(), Achievement.code.asc()).all()
    return [
        {
            "code": a.code,
            "title": a.title,
            "description": a.description,
            "points": int(a.points or 0),
        }
        for a in rows
    ]
