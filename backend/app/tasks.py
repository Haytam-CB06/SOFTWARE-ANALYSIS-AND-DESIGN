from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Dict, Any, List

from celery.utils.log import get_task_logger  # type: ignore

from app.celery_app import celery_app
from app.db import init_engine, session_scope
from app.services.notification_processor import process_due_email_notifications_core
from app.services.session_reminders import (
    rebuild_upcoming_session_email_reminders as rebuild_user_session_reminders
)

logger = get_task_logger(__name__)


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


@celery_app.task(
    name="app.tasks.process_due_email_notifications",
    bind=True,
    autoretry_for=(Exception,),
    retry_backoff=True,
    retry_kwargs={"max_retries": 5},
)
def process_due_email_notifications(self, limit: int = 200) -> Dict[str, Any]:
    """Send any due email notifications.

    Runs periodically via Celery Beat, or can be called manually.
    """
    init_engine()
    with session_scope() as db:
        res = process_due_email_notifications_core(db=db, limit=limit)
    logger.info("Processed due notifications: %s", res)
    return res


@celery_app.task(
    name="app.tasks.rebuild_upcoming_session_reminders",
    bind=True,
    autoretry_for=(Exception,),
    retry_backoff=True,
    retry_kwargs={"max_retries": 3},
)
def rebuild_upcoming_session_reminders(self, window_days: int = 7) -> Dict[str, Any]:
    """Best-effort reminder rebuild for users with planned sessions in the upcoming window."""
    init_engine()

    from sqlalchemy import and_  # imported lazily to avoid celery import edge cases
    from app.models.study_session import StudySession
    from app.models.preferences import Preferences

    now = _utcnow()
    end = now + timedelta(days=int(window_days))

    user_ids: List[str] = []
    with session_scope() as db:
        # Only users that:
        # - have planned sessions in the upcoming window
        # - have email reminders enabled
        q = (
            db.query(StudySession.user_id)
            .distinct()
            .join(Preferences, Preferences.user_id == StudySession.user_id)
            .filter(
                and_(
                    StudySession.status == "planned",
                    StudySession.start_at >= now,
                    StudySession.start_at <= end,
                    Preferences.email_reminders_enabled == True,  # noqa: E712
                )
            )
        )
        user_ids = [str(r[0]) for r in q.all()]

    totals = {
        "window_days": int(window_days),
        "users": len(user_ids),
        "scanned_sessions": 0,
        "created": 0,
        "updated": 0,
        "cancelled_duplicates": 0,
    }

    from uuid import UUID
    for uid in user_ids:
        with session_scope() as db:
            r = rebuild_user_session_reminders(db=db, user_id=UUID(uid), window_days=int(window_days))
            totals["scanned_sessions"] += int(getattr(r, "scanned_sessions", 0))
            totals["created"] += int(getattr(r, "created", 0))
            totals["updated"] += int(getattr(r, "updated", 0))
            totals["cancelled_duplicates"] += int(getattr(r, "cancelled_duplicates", 0))

    logger.info("Rebuilt reminders: %s", totals)
    return totals
