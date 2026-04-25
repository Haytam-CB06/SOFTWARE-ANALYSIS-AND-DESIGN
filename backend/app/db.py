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

    engine_kwargs = {
        "future": True,
        "pool_pre_ping": True,
        "echo": False,
    }

    if db_url.startswith("sqlite"):
        engine_kwargs["connect_args"] = {"check_same_thread": False}
    elif db_url.startswith("postgres"):
        engine_kwargs["pool_size"] = int(os.getenv("DB_POOL_SIZE", "5"))
        engine_kwargs["max_overflow"] = int(os.getenv("DB_MAX_OVERFLOW", "10"))
        engine_kwargs["pool_recycle"] = int(os.getenv("DB_POOL_RECYCLE_SECONDS", "1800"))

    _ENGINE = create_engine(db_url, **engine_kwargs)
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
                conn.execute(text(
                    "ALTER TABLE IF EXISTS users "
                    "ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ NULL"
                ))
                conn.execute(text(
                    "ALTER TABLE IF EXISTS workspace_members "
                    "ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ NULL"
                ))
                conn.execute(text(
                    "ALTER TABLE IF EXISTS user_profiles "
                    "ADD COLUMN IF NOT EXISTS profile_title TEXT NULL"
                ))
                conn.execute(text(
                    "ALTER TABLE IF EXISTS user_profiles "
                    "ADD COLUMN IF NOT EXISTS background_theme TEXT NULL"
                ))
            elif db_url.startswith("sqlite"):
                cols = conn.execute(text("PRAGMA table_info(users)")).all()
                names = {c[1] for c in cols}
                if cols and "is_banned" not in names:
                    conn.execute(text("ALTER TABLE users ADD COLUMN is_banned BOOLEAN NOT NULL DEFAULT 0"))
                if cols and "last_seen_at" not in names:
                    conn.execute(text("ALTER TABLE users ADD COLUMN last_seen_at DATETIME"))
                workspace_member_cols = conn.execute(text("PRAGMA table_info(workspace_members)")).all()
                workspace_member_names = {c[1] for c in workspace_member_cols}
                if workspace_member_cols and "last_seen_at" not in workspace_member_names:
                    conn.execute(text("ALTER TABLE workspace_members ADD COLUMN last_seen_at DATETIME"))
                user_profile_cols = conn.execute(text("PRAGMA table_info(user_profiles)")).all()
                user_profile_names = {c[1] for c in user_profile_cols}
                if user_profile_cols and "profile_title" not in user_profile_names:
                    conn.execute(text("ALTER TABLE user_profiles ADD COLUMN profile_title TEXT"))
                if user_profile_cols and "background_theme" not in user_profile_names:
                    conn.execute(text("ALTER TABLE user_profiles ADD COLUMN background_theme TEXT"))

            # Performance indexes for the high-traffic dashboard/workspace reads.
            if db_url.startswith("postgres"):
                index_statements = [
                    "CREATE INDEX IF NOT EXISTS ix_friendships_requester_status ON friendships (requester_id, status)",
                    "CREATE INDEX IF NOT EXISTS ix_friendships_addressee_status ON friendships (addressee_id, status)",
                    "CREATE INDEX IF NOT EXISTS ix_direct_messages_sender_recipient_created ON direct_messages (sender_id, recipient_id, created_at DESC)",
                    "CREATE INDEX IF NOT EXISTS ix_direct_messages_recipient_sender_created ON direct_messages (recipient_id, sender_id, created_at DESC)",
                    "CREATE UNIQUE INDEX IF NOT EXISTS uq_direct_conversation_preference_user_friend ON direct_conversation_preferences (user_id, friend_id)",
                    "CREATE INDEX IF NOT EXISTS ix_direct_conversation_preferences_user_pinned ON direct_conversation_preferences (user_id, pinned)",
                    "CREATE INDEX IF NOT EXISTS ix_workspace_members_user_workspace ON workspace_members (user_id, workspace_id)",
                    "CREATE INDEX IF NOT EXISTS ix_workspace_members_workspace_user ON workspace_members (workspace_id, user_id)",
                    "CREATE INDEX IF NOT EXISTS ix_workspaces_created_at ON workspaces (created_at DESC)",
                    "CREATE INDEX IF NOT EXISTS ix_board_tasks_workspace_archived_updated ON board_tasks (workspace_id, archived, updated_at DESC)",
                    "CREATE INDEX IF NOT EXISTS ix_board_tasks_workspace_status ON board_tasks (workspace_id, status)",
                    "CREATE INDEX IF NOT EXISTS ix_workspace_messages_workspace_created ON workspace_messages (workspace_id, created_at DESC)",
                    "CREATE INDEX IF NOT EXISTS ix_workspace_message_reads_user_message ON workspace_message_reads (user_id, message_id)",
                    "CREATE INDEX IF NOT EXISTS ix_study_sessions_user_start ON study_sessions (user_id, start_at)",
                    "CREATE INDEX IF NOT EXISTS ix_study_sessions_user_status_start ON study_sessions (user_id, status, start_at)",
                    "CREATE INDEX IF NOT EXISTS ix_assessments_subject_due ON assessments (subject_id, due_at)",
                    "CREATE INDEX IF NOT EXISTS ix_notifications_user_send ON notifications (user_id, send_at DESC)",
                    "CREATE INDEX IF NOT EXISTS ix_notifications_status_send ON notifications (status, send_at)",
                    "CREATE INDEX IF NOT EXISTS ix_study_timetables_user_created ON study_timetables (user_id, created_at DESC)",
                    "CREATE INDEX IF NOT EXISTS ix_study_timetables_user_active_updated ON study_timetables (user_id, is_active, updated_at DESC)",
                    "CREATE INDEX IF NOT EXISTS ix_goals_user_period ON goals (user_id, period_start, period_end)",
                    "CREATE INDEX IF NOT EXISTS ix_workspace_join_requests_workspace_status_requested ON workspace_join_requests (workspace_id, status, requested_at)",
                ]
                for statement in index_statements:
                    conn.execute(text(statement))
            elif db_url.startswith("sqlite"):
                index_statements = [
                    "CREATE INDEX IF NOT EXISTS ix_friendships_requester_status ON friendships (requester_id, status)",
                    "CREATE INDEX IF NOT EXISTS ix_friendships_addressee_status ON friendships (addressee_id, status)",
                    "CREATE INDEX IF NOT EXISTS ix_direct_messages_sender_recipient_created ON direct_messages (sender_id, recipient_id, created_at)",
                    "CREATE INDEX IF NOT EXISTS ix_direct_messages_recipient_sender_created ON direct_messages (recipient_id, sender_id, created_at)",
                    "CREATE UNIQUE INDEX IF NOT EXISTS uq_direct_conversation_preference_user_friend ON direct_conversation_preferences (user_id, friend_id)",
                    "CREATE INDEX IF NOT EXISTS ix_direct_conversation_preferences_user_pinned ON direct_conversation_preferences (user_id, pinned)",
                    "CREATE INDEX IF NOT EXISTS ix_workspace_members_user_workspace ON workspace_members (user_id, workspace_id)",
                    "CREATE INDEX IF NOT EXISTS ix_workspace_members_workspace_user ON workspace_members (workspace_id, user_id)",
                    "CREATE INDEX IF NOT EXISTS ix_workspaces_created_at ON workspaces (created_at)",
                    "CREATE INDEX IF NOT EXISTS ix_board_tasks_workspace_archived_updated ON board_tasks (workspace_id, archived, updated_at)",
                    "CREATE INDEX IF NOT EXISTS ix_board_tasks_workspace_status ON board_tasks (workspace_id, status)",
                    "CREATE INDEX IF NOT EXISTS ix_workspace_messages_workspace_created ON workspace_messages (workspace_id, created_at)",
                    "CREATE INDEX IF NOT EXISTS ix_workspace_message_reads_user_message ON workspace_message_reads (user_id, message_id)",
                    "CREATE INDEX IF NOT EXISTS ix_study_sessions_user_start ON study_sessions (user_id, start_at)",
                    "CREATE INDEX IF NOT EXISTS ix_study_sessions_user_status_start ON study_sessions (user_id, status, start_at)",
                    "CREATE INDEX IF NOT EXISTS ix_assessments_subject_due ON assessments (subject_id, due_at)",
                    "CREATE INDEX IF NOT EXISTS ix_notifications_user_send ON notifications (user_id, send_at)",
                    "CREATE INDEX IF NOT EXISTS ix_notifications_status_send ON notifications (status, send_at)",
                    "CREATE INDEX IF NOT EXISTS ix_study_timetables_user_created ON study_timetables (user_id, created_at)",
                    "CREATE INDEX IF NOT EXISTS ix_study_timetables_user_active_updated ON study_timetables (user_id, is_active, updated_at)",
                    "CREATE INDEX IF NOT EXISTS ix_goals_user_period ON goals (user_id, period_start, period_end)",
                    "CREATE INDEX IF NOT EXISTS ix_workspace_join_requests_workspace_status_requested ON workspace_join_requests (workspace_id, status, requested_at)",
                ]
                for statement in index_statements:
                    conn.execute(text(statement))
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
        # Most routes commit explicitly when they mutate data. Avoid issuing a
        # database COMMIT for pure read requests, because it adds latency to the
        # high-traffic dashboard/list endpoints without changing state.
        if db.new or db.dirty or db.deleted:
            db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()
