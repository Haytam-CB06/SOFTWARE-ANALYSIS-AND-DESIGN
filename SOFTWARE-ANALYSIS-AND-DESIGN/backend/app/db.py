# backend/app/db.py
"""Database setup and FastAPI session dependency.

Why this file matters:
 - We import `app.models` at import time so *all* ORM models are registered on
   Base.metadata.
 - We still call `Base.metadata.create_all()` on startup because this project
   is currently running without a complete Alembic migration history.
"""

import os
from contextlib import contextmanager
from typing import Generator

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

from app.models.base import Base
import app.models  # noqa: F401  (register models via side effects)

_ENGINE = None
_SessionLocal = None


def init_engine() -> None:
    """Initialize global engine + session factory from DATABASE_URL."""
    global _ENGINE, _SessionLocal
    if _ENGINE is not None and _SessionLocal is not None:
        return

    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        raise RuntimeError("DATABASE_URL is not set")

    _ENGINE = create_engine(
        db_url,
        future=True,
        pool_pre_ping=True,
        echo=False,
    )
    _SessionLocal = sessionmaker(
        bind=_ENGINE,
        autoflush=False,
        autocommit=False,
        future=True,
    )

    # NOTE: In production, prefer Alembic migrations.
    Base.metadata.create_all(bind=_ENGINE)

    # ------------------------------------------------------------------
    # Lightweight schema safety for dev environments
    # ------------------------------------------------------------------
    # This project runs without a complete Alembic history. When we add new
    # columns to existing tables, create_all() will NOT backfill them.
    # The following keeps the app from crashing on existing databases.
    try:
        with _ENGINE.begin() as conn:
            # assessments: add tracking placeholders if missing
            if db_url.startswith("postgres"):
                conn.execute(text(
                    "ALTER TABLE IF EXISTS assessments "
                    "ADD COLUMN IF NOT EXISTS is_completed BOOLEAN NOT NULL DEFAULT FALSE"
                ))
                conn.execute(text(
                    "ALTER TABLE IF EXISTS assessments "
                    "ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ NULL"
                ))
            elif db_url.startswith("sqlite"):
                cols = conn.execute(text("PRAGMA table_info(assessments)")).all()
                names = {c[1] for c in cols}  # (cid, name, type, ...)
                if cols and "is_completed" not in names:
                    conn.execute(text("ALTER TABLE assessments ADD COLUMN is_completed BOOLEAN NOT NULL DEFAULT 0"))
                if cols and "completed_at" not in names:
                    conn.execute(text("ALTER TABLE assessments ADD COLUMN completed_at DATETIME"))

            # preferences: add email reminder prefs if missing
            if db_url.startswith("postgres"):
                conn.execute(text(
                    "ALTER TABLE IF EXISTS preferences "
                    "ADD COLUMN IF NOT EXISTS email_reminders_enabled BOOLEAN NOT NULL DEFAULT TRUE"
                ))
                conn.execute(text(
                    "ALTER TABLE IF EXISTS preferences "
                    "ADD COLUMN IF NOT EXISTS email_reminder_minutes_before SMALLINT NOT NULL DEFAULT 10"
                ))

                # CP-02a: additional per-type email preferences
                conn.execute(text(
                    "ALTER TABLE IF EXISTS preferences "
                    "ADD COLUMN IF NOT EXISTS email_deadline_alerts_enabled BOOLEAN NOT NULL DEFAULT TRUE"
                ))
                conn.execute(text(
                    "ALTER TABLE IF EXISTS preferences "
                    "ADD COLUMN IF NOT EXISTS email_achievement_alerts_enabled BOOLEAN NOT NULL DEFAULT TRUE"
                ))
                conn.execute(text(
                    "ALTER TABLE IF EXISTS preferences "
                    "ADD COLUMN IF NOT EXISTS email_weekly_summary_enabled BOOLEAN NOT NULL DEFAULT TRUE"
                ))
            elif db_url.startswith("sqlite"):
                cols = conn.execute(text("PRAGMA table_info(preferences)")).all()
                names = {c[1] for c in cols}
                if cols and "email_reminders_enabled" not in names:
                    conn.execute(text("ALTER TABLE preferences ADD COLUMN email_reminders_enabled BOOLEAN NOT NULL DEFAULT 1"))
                if cols and "email_reminder_minutes_before" not in names:
                    conn.execute(text("ALTER TABLE preferences ADD COLUMN email_reminder_minutes_before INTEGER NOT NULL DEFAULT 10"))

                # CP-02a: additional per-type email preferences
                if cols and "email_deadline_alerts_enabled" not in names:
                    conn.execute(text("ALTER TABLE preferences ADD COLUMN email_deadline_alerts_enabled BOOLEAN NOT NULL DEFAULT 1"))
                if cols and "email_achievement_alerts_enabled" not in names:
                    conn.execute(text("ALTER TABLE preferences ADD COLUMN email_achievement_alerts_enabled BOOLEAN NOT NULL DEFAULT 1"))
                if cols and "email_weekly_summary_enabled" not in names:
                    conn.execute(text("ALTER TABLE preferences ADD COLUMN email_weekly_summary_enabled BOOLEAN NOT NULL DEFAULT 1"))

            # study_sessions: add actual_duration_seconds for "every second counts" if missing
            if db_url.startswith("postgres"):
                conn.execute(text(
                    "ALTER TABLE IF EXISTS study_sessions "
                    "ADD COLUMN IF NOT EXISTS actual_duration_seconds INTEGER NULL"
                ))
            elif db_url.startswith("sqlite"):
                cols = conn.execute(text("PRAGMA table_info(study_sessions)")).all()
                names = {c[1] for c in cols}
                if cols and "actual_duration_seconds" not in names:
                    conn.execute(text("ALTER TABLE study_sessions ADD COLUMN actual_duration_seconds INTEGER"))

            # login_history: ensure required columns exist so Global Admin "Last sign-in" works
            # (Some dev DBs may have an older/partial schema.)
            if db_url.startswith("postgres"):
                conn.execute(text(
                    "ALTER TABLE IF EXISTS login_history "
                    "ADD COLUMN IF NOT EXISTS login_time TIMESTAMPTZ NOT NULL DEFAULT NOW()"
                ))
                conn.execute(text(
                    "ALTER TABLE IF EXISTS login_history "
                    "ADD COLUMN IF NOT EXISTS ip_address VARCHAR(45) NULL"
                ))
            elif db_url.startswith("sqlite"):
                cols = conn.execute(text("PRAGMA table_info(login_history)")).all()
                names = {c[1] for c in cols}
                if cols and "login_time" not in names:
                    conn.execute(text("ALTER TABLE login_history ADD COLUMN login_time DATETIME DEFAULT CURRENT_TIMESTAMP"))
                if cols and "ip_address" not in names:
                    conn.execute(text("ALTER TABLE login_history ADD COLUMN ip_address TEXT"))

            # users: add global moderation flag if missing (CP-08)
            if db_url.startswith("postgres"):
                conn.execute(text(
                    "ALTER TABLE IF EXISTS users "
                    "ADD COLUMN IF NOT EXISTS is_banned BOOLEAN NOT NULL DEFAULT FALSE"
                ))
            elif db_url.startswith("sqlite"):
                cols = conn.execute(text("PRAGMA table_info(users)")).all()
                names = {c[1] for c in cols}
                if cols and "is_banned" not in names:
                    conn.execute(text("ALTER TABLE users ADD COLUMN is_banned BOOLEAN NOT NULL DEFAULT 0"))
    except Exception:
        # Best-effort only; ignore if database/user lacks permissions.
        pass


def get_session():
    """Return a new SQLAlchemy Session. Use this in scripts."""
    if _SessionLocal is None:
        raise RuntimeError("DB not initialized. Call init_engine() first.")
    return _SessionLocal()


@contextmanager
def session_scope():
    """Context manager for scripts/jobs."""
    sess = get_session()
    try:
        yield sess
        sess.commit()
    except Exception:
        sess.rollback()
        raise
    finally:
        sess.close()


def get_db() -> Generator:
    """FastAPI dependency: yield a Session per request."""
    if _SessionLocal is None:
        init_engine()

    db = _SessionLocal()
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()
