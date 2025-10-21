import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

ENGINE = None
SessionLocal = None

def init_engine():
    global ENGINE, SessionLocal
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        raise RuntimeError("DATABASE_URL env var is not set")
    ENGINE = create_engine(db_url, pool_pre_ping=True, future=True)
    SessionLocal = sessionmaker(bind=ENGINE, autoflush=False, autocommit=False, future=True)

def get_session():
    if SessionLocal is None:
        raise RuntimeError("DB not initialized; call init_engine() first")
    return SessionLocal()

