from __future__ import annotations

import os
import threading
import time

from app.db import session_scope
from app.services.notification_processor import process_due_email_notifications_core


_lock = threading.Lock()


def start_notification_poller() -> None:
    """Start a lightweight in-process poller for due email notifications.

    This is intentionally simple (no Redis/Celery) so dev setups can still
    deliver real emails. In production, prefer CP-15 (job infra) instead.

    Controlled via env:
      - ENABLE_NOTIFICATION_POLLER=true|false (default: false)
      - NOTIFICATION_POLL_SECONDS (default: 15)
    """

    enabled = (os.getenv("ENABLE_NOTIFICATION_POLLER") or "").strip().lower()
    if enabled not in {"1", "true", "yes", "on"}:
        return

    try:
        poll_seconds = int((os.getenv("NOTIFICATION_POLL_SECONDS") or "15").strip())
    except Exception:
        poll_seconds = 15

    def _loop() -> None:
        while True:
            try:
                # Avoid overlapping polls in the same process.
                if not _lock.acquire(blocking=False):
                    time.sleep(max(1, poll_seconds))
                    continue
                try:
                    with session_scope() as db:
                        process_due_email_notifications_core(db=db, limit=200)
                finally:
                    _lock.release()
            except Exception:
                # Best-effort; keep the poller alive.
                pass
            time.sleep(max(1, poll_seconds))

    t = threading.Thread(target=_loop, name="notification_poller", daemon=True)
    t.start()
