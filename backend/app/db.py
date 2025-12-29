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
