import os
from logging.config import fileConfig
from sqlalchemy import engine_from_config, pool
from alembic import context

# --- Load .env if present (local dev) ---
try:
    from dotenv import load_dotenv  # type: ignore
    load_dotenv()
except Exception:
    pass

# Interpret the config file for Python logging.
config = context.config
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# --- DATABASE_URL from environment (preferred) ---
db_url = os.getenv("DATABASE_URL")
if not db_url:
    raise RuntimeError("DATABASE_URL is not set. Put it in your .env for local dev.")
config.set_main_option("sqlalchemy.url", db_url)

# --- Import models & metadata ---
# Your models live in app/models/*.py. We import them so they register on Base.metadata.
from app.models.base import Base  # Base = declarative base
# Import all model modules so autogenerate sees tables
from app.models import (
    user,
    subject,
    study_session,
    preferences,
    availability,
    goals,
    session_feedback,
    class_meeting,
    assessment,
    calendar_account,
    calendar_event,
    activity_log,
    notification,
)

target_metadata = Base.metadata

# --- Offline / Online runners ---
def run_migrations_offline():
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,      # detect column type diffs
        compare_server_default=True,
    )

    with context.begin_transaction():
        context.run_migrations()


from sqlalchemy import create_engine

def run_migrations_online():
    url = config.get_main_option("sqlalchemy.url")
    if not url:
        raise RuntimeError("sqlalchemy.url not set in Alembic config")

    connectable = create_engine(url, poolclass=pool.NullPool, future=True)

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
            compare_server_default=True,
            render_as_batch=False,
        )

        with context.begin_transaction():
            context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
