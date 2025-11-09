# backend/app/db.py
import os
from contextlib import contextmanager
from typing import Generator

from sqlalchemy import create_engine, Column, DateTime, text
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.dialects.postgresql import UUID

# ==================== BASE & MIXINS ====================
Base = declarative_base()


class UUIDPkMixin:
    """Mixin providing UUID primary key with server-side generation."""
    id = Column(UUID(as_uuid=True), primary_key=True,
                server_default=text("gen_random_uuid()"))


class TimestampMixin:
    """Mixin providing created_at and updated_at timestamps."""
    created_at = Column(DateTime(timezone=True),
                        nullable=False, server_default=text("now()"))
    updated_at = Column(DateTime(timezone=True),
                        nullable=False, server_default=text("now()"))


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
        echo=False,  # set True to debug SQL
    )
    _SessionLocal = sessionmaker(
        bind=_ENGINE,
        autoflush=False,
        autocommit=False,
        future=True,
    )


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
    except:
        sess.rollback()
        raise
    finally:
        sess.close()

# ---------- FastAPI dependency ----------


def get_db() -> Generator:
    """Yield a Session per-request. FastAPI will close it afterward."""
    if _SessionLocal is None:
        init_engine()
    db = _SessionLocal()
    try:
        yield db
        db.commit()
    except:
        db.rollback()
        raise
    finally:
        db.close()
