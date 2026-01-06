from __future__ import annotations

import os

from celery import Celery

try:
    # Load .env for local/dev runs
    from dotenv import load_dotenv  # type: ignore
    load_dotenv()
except Exception:
    pass


def _get_redis_url() -> str:
    return os.getenv("REDIS_URL", "redis://localhost:6379/0")


celery_app = Celery(
    "workspace_calendar",
    broker=_get_redis_url(),
    backend=os.getenv("CELERY_RESULT_BACKEND", _get_redis_url()),
    include=["app.tasks"],
)

# Basic hardening defaults
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    enable_utc=True,
    timezone=os.getenv("CELERY_TIMEZONE", "UTC"),
    task_acks_late=True,
    worker_prefetch_multiplier=1,
    broker_connection_retry_on_startup=True,
)

# Periodic schedules (Celery Beat)
try:
    from celery.schedules import crontab  # type: ignore

    celery_app.conf.beat_schedule = {
        # Keep notifications flowing without in-process poller.
        "process_due_email_notifications_every_10s": {
            "task": "app.tasks.process_due_email_notifications",
            "schedule": float(os.getenv("NOTIFICATION_BEAT_SECONDS", "10")),
            "args": (200,),
        },
        # Best-effort reminder rebuild in case anything drifted.
        "rebuild_upcoming_session_reminders_every_30m": {
            "task": "app.tasks.rebuild_upcoming_session_reminders",
            "schedule": crontab(minute="*/30"),
            "args": (7,),
        },
    }
except Exception:
    # Beat schedule is optional; worker can still run ad-hoc tasks.
    pass
