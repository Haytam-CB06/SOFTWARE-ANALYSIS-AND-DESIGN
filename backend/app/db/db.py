import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

ENGINE = None
SessionLocal = None


def init_engine():
    global ENGINE, SessionLocal
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        raise RuntimeError("DATABASE_URL is not set")
    ENGINE = create_engine(db_url, future=True, pool_pre_ping=True, echo=False)
    SessionLocal = sessionmaker(
        bind=ENGINE, autoflush=False, autocommit=False, future=True)


def get_session():
    global SessionLocal
    if SessionLocal is None:
        init_engine()
    return SessionLocal()
