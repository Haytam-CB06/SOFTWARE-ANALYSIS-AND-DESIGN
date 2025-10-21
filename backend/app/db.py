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
    # echo=False keeps logs quiet; SQLite works too
    ENGINE = create_engine(db_url, future=True, pool_pre_ping=True, echo=False)
    SessionLocal = sessionmaker(bind=ENGINE, autoflush=False, autocommit=False, future=True)

def get_session():
    if SessionLocal is None:
        raise RuntimeError("DB not initialized. Call init_engine() first.")
    return SessionLocal()
