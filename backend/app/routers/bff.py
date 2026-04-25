from __future__ import annotations

import os
import time
import json
from collections import defaultdict
from datetime import date, datetime, time as dt_time, timedelta, timezone
from decimal import Decimal
from typing import Any, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Header, HTTPException, Query
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.assessment import Assessment
from app.models.board import BoardTask
from app.models.goals import Goal
from app.models.notification import Notification
from app.models.study_session import StudySession
from app.models.study_timetable import StudyTimetable
from app.models.subject import Subject
from app.models.user import User
from app.models.workspace import Workspace, WorkspaceMember


router = APIRouter(prefix="/bff", tags=["bff"])

_DASHBOARD_CACHE: dict[str, tuple[float, dict[str, Any]]] = {}


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _week_bounds(today: Optional[date] = None) -> tuple[date, date]:
    d = today or _utcnow().date()
    start = d - timedelta(days=d.weekday())
    return start, start + timedelta(days=6)


def _priority_from_difficulty(difficulty: Optional[int]) -> str:
    if difficulty is None:
        return "medium"
    if difficulty >= 4:
        return "high"
    if difficulty >= 2:
        return "medium"
    return "low"


def _as_float(value: Any) -> float:
    if value is None:
        return 0.0
    if isinstance(value, Decimal):
        return float(value)
    return float(value)


def _parse_notification_template(template: str) -> tuple[str, Optional[str], Optional[str]]:
    raw = (template or "").strip()
    if not raw:
        return "", None, None

    try:
        payload = json.loads(raw)
        if isinstance(payload, dict):
            message = str(payload.get("message") or payload.get("text") or raw)
            deep_link = payload.get("deep_link")
            notification_type = payload.get("type")
            return (
                message,
                deep_link if isinstance(deep_link, str) else None,
                notification_type if isinstance(notification_type, str) else None,
            )
    except Exception:
        pass

    return raw, None, None


def _notification_title(channel: str, status: str, notification_type: Optional[str]) -> str:
    if notification_type == "session_reminder":
        return "Study Session Reminder"
    if status == "failed":
        return "Notification Failed"
    if channel == "email":
        return "Email Reminder"
    if channel == "push":
        return "Push Notification"
    return "Notification"


def _require_user(db: Session, user_id: UUID) -> None:
    exists = db.query(User.id).filter(User.id == user_id).first()
    if not exists:
        raise HTTPException(status_code=404, detail="User not found")


def _dashboard_cache_ttl() -> int:
    return int(os.getenv("DASHBOARD_CACHE_TTL_SECONDS", "30"))


@router.get("/dashboard", response_model=dict)
def dashboard_bff(
    user_id: UUID = Query(...),
    workspace_id: Optional[int] = Query(default=None),
    refresh: bool = Query(default=False),
    db: Session = Depends(get_db),
    x_user_id: str = Header(default="", alias="X-User-Id"),
):
    """Compact dashboard payload for the local monolith.

    The Vite app already asks for this endpoint. Providing it in the local
    FastAPI app avoids a failed BFF call followed by several fallback requests.
    """
    if x_user_id and x_user_id != str(user_id):
        raise HTTPException(status_code=401, detail="Unauthorized")

    cache_ttl = _dashboard_cache_ttl()
    cache_key = f"{user_id}:{workspace_id or 'default'}"
    cached = _DASHBOARD_CACHE.get(cache_key)
    now_ts = time.monotonic()
    if not refresh and cached and cached[0] > now_ts:
        payload = dict(cached[1])
        payload["cache"] = {"hit": True, "ttl_seconds": cache_ttl}
        return payload

    _require_user(db, user_id)

    workspaces = (
        db.query(Workspace)
        .join(WorkspaceMember, WorkspaceMember.workspace_id == Workspace.id)
        .filter(WorkspaceMember.user_id == user_id)
        .order_by(Workspace.created_at.desc())
        .limit(5)
        .all()
    )
    workspace_rows = [
        {
            "id": w.id,
            "name": w.name,
            "description": w.description,
            "created_at": w.created_at.isoformat() if w.created_at else None,
            "parent_id": getattr(w, "parent_id", None),
            "image_url": getattr(w, "image_url", None),
        }
        for w in workspaces
    ]

    selected_workspace_id = workspace_id or (workspace_rows[0]["id"] if workspace_rows else None)

    schedules = (
        db.query(StudyTimetable)
        .filter(StudyTimetable.user_id == user_id)
        .order_by(StudyTimetable.created_at.desc())
        .limit(8)
        .all()
    )
    today_schedule = [
        {
            "id": str(t.id),
            "name": getattr(t, "name", None),
            "is_active": bool(getattr(t, "is_active", False)),
            "created_at": t.created_at.isoformat() if getattr(t, "created_at", None) else None,
            "updated_at": t.updated_at.isoformat() if getattr(t, "updated_at", None) else None,
        }
        for t in schedules
    ]

    assessments = (
        db.query(Assessment, Subject)
        .join(Subject, Assessment.subject_id == Subject.id)
        .filter(Subject.user_id == user_id)
        .order_by(Assessment.due_at.asc())
        .limit(8)
        .all()
    )
    assessment_rows = [
        {
            "id": str(a.id),
            "title": a.title,
            "subject": (getattr(s, "title", None) or getattr(s, "name", None) or "(Untitled)"),
            "type": a.kind,
            "dueDate": a.due_at.isoformat(),
            "priority": _priority_from_difficulty(getattr(s, "difficulty", None)),
            "completed": bool(getattr(a, "is_completed", False)),
            "completedAt": a.completed_at.isoformat() if getattr(a, "completed_at", None) else None,
        }
        for a, s in assessments
    ]

    assigned_tasks: list[dict[str, Any]] = []
    if selected_workspace_id is not None:
        tasks = (
            db.query(BoardTask)
            .filter(
                BoardTask.workspace_id == selected_workspace_id,
                BoardTask.archived == False,  # noqa: E712
            )
            .order_by(BoardTask.updated_at.desc())
            .limit(8)
            .all()
        )
        assignee_ids = {t.assignee_id for t in tasks if t.assignee_id}
        users_by_id = {}
        if assignee_ids:
            users_by_id = {u.id: u for u in db.query(User).filter(User.id.in_(assignee_ids)).all()}

        for task in tasks:
            assignee = users_by_id.get(task.assignee_id)
            assigned_tasks.append(
                {
                    "id": str(task.id),
                    "title": task.title,
                    "description": task.description or "",
                    "status": task.status,
                    "priority": task.priority or "medium",
                    "assignee": (
                        {
                            "id": str(assignee.id),
                            "name": getattr(assignee, "full_name", None) or assignee.email,
                            "email": assignee.email,
                        }
                        if assignee
                        else None
                    ),
                    "createdAt": task.created_at.isoformat() if task.created_at else None,
                    "updatedAt": task.updated_at.isoformat() if task.updated_at else None,
                    "createdBy": str(task.created_by) if task.created_by else None,
                    "comments": [],
                    "attachments": getattr(task, "attachments_count", 0),
                }
            )

    ps, pe = _week_bounds()
    start_dt = datetime.combine(ps, dt_time.min).replace(tzinfo=timezone.utc)
    end_dt = datetime.combine(pe + timedelta(days=1), dt_time.min).replace(tzinfo=timezone.utc)

    completed_sessions = (
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
    by_day: dict[str, float] = defaultdict(float)
    for session in completed_sessions:
        seconds = (
            float(session.actual_duration_seconds)
            if getattr(session, "actual_duration_seconds", None) is not None
            else float((session.end_at - session.start_at).total_seconds())
        )
        if seconds < 0:
            continue
        hours = seconds / 3600.0
        total_hours += hours
        by_day[session.start_at.date().isoformat()] += hours

    goals = (
        db.query(Goal, Subject)
        .outerjoin(Subject, Goal.subject_id == Subject.id)
        .filter(Goal.user_id == user_id, Goal.period_start == ps, Goal.period_end == pe)
        .order_by(Goal.subject_id.is_(None).desc(), Goal.weight.desc())
        .all()
    )
    goal_rows = [
        {
            "id": str(g.id),
            "user_id": str(g.user_id),
            "subject_id": str(g.subject_id) if g.subject_id else None,
            "subject_title": (getattr(s, "title", None) or getattr(s, "name", None)) if s else None,
            "period_start": g.period_start.isoformat(),
            "period_end": g.period_end.isoformat(),
            "target_hours": _as_float(g.target_hours),
            "weight": int(g.weight) if g.weight is not None else None,
        }
        for g, s in goals
    ]

    notifications = (
        db.query(Notification)
        .filter(Notification.user_id == user_id, Notification.status != "cancelled")
        .filter(Notification.send_at <= _utcnow())
        .order_by(Notification.send_at.desc())
        .limit(8)
        .all()
    )
    notification_rows = []
    for n in notifications:
        message, deep_link, notification_type = _parse_notification_template(n.template)
        notification_rows.append(
            {
                "id": str(n.id),
                "user_id": str(n.user_id),
                "session_id": str(n.session_id) if n.session_id else None,
                "channel": n.channel,
                "template": n.template,
                "title": _notification_title(n.channel, n.status, notification_type),
                "message": message,
                "type": notification_type or "info",
                "deep_link": deep_link,
                "send_at": n.send_at.isoformat() if n.send_at else None,
                "status": n.status,
                "error_message": n.error_message,
            }
        )

    payload = {
        "user_id": str(user_id),
        "workspace_id": selected_workspace_id,
        "dashboard": {
            "workspaces": workspace_rows,
            "today_schedule": today_schedule,
            "assigned_tasks": assigned_tasks,
            "assessments": assessment_rows,
            "notifications": notification_rows,
            "recent_chat": [],
            "week_summary": {
                "period_start": ps.isoformat(),
                "period_end": pe.isoformat(),
                "total_completed_hours": round(total_hours, 2),
                "by_day": {k: round(v, 2) for k, v in sorted(by_day.items())},
            },
            "week_goals": {
                "goals": goal_rows,
                "period_start": ps.isoformat(),
                "period_end": pe.isoformat(),
            },
        },
        "meta": {"source": "local-monolith-bff"},
        "cache": {"hit": False, "ttl_seconds": cache_ttl},
    }

    if cache_ttl > 0:
        _DASHBOARD_CACHE[cache_key] = (now_ts + cache_ttl, payload)
    return payload
