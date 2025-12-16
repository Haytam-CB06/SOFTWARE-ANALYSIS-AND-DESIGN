# backend/app/db.py
import os
from contextlib import contextmanager
from typing import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# ✅ IMPORTANT:
# Import Base and import the models package at *module import time*.
# This registers all models on Base.metadata (so create_all / Alembic can "see" tables).
from app.models.base import Base
import app.models  # noqa: F401  (needed for side-effects)

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

    # NOTE: In production, prefer Alembic migrations instead of create_all.
    # Keeping create_all here because your project currently expects tables to exist at startup.
    Base.metadata.create_all(bind=_ENGINE)


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


# ---------- FastAPI dependency ----------

def get_db() -> Generator:
    """Yield a Session per-request. FastAPI will close it afterward."""
    if _SessionLocal is None:
        init_engine()

    db = _SessionLocal()
    try:
        yield db
        # If your routers already commit(), you can remove the next line.
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()
# backend/app/db.py
import os
from contextlib import contextmanager
from typing import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.models.base import Base
import app.models

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

    # NOTE: In production, prefer Alembic migrations instead of create_all.
    # Keeping create_all here because your project currently expects tables to exist at startup.
    Base.metadata.create_all(bind=_ENGINE)


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


# ---------- FastAPI dependency ----------

def get_db() -> Generator:
    """Yield a Session per-request. FastAPI will close it afterward."""
    if _SessionLocal is None:
        init_engine()

    db = _SessionLocal()
    try:
        yield db
        # If your routers already commit(), you can remove the next line.
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()
