# backend/migrations/env.py
import os
import sys
from logging.config import fileConfig
from alembic import context
from sqlalchemy import engine_from_config, pool

# --- Load .env if present (optional but handy for local dev)
try:
    from dotenv import load_dotenv  # pip install python-dotenv (you have it)
    # Look for .env in repo root or backend/
    candidates = [
        os.path.join(os.path.dirname(__file__), "..", "..", ".env"),
        os.path.join(os.path.dirname(__file__), "..", ".env"),
    ]
    for p in candidates:
        if os.path.exists(p):
            load_dotenv(p)
            break
except Exception:
    pass

# This is the Alembic Config object
config = context.config

# Logging config from alembic.ini (optional)
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Make sure we can import app.models.*
# When you run alembic from backend/, backend is on sys.path, so this is usually not needed.
# Left here in case users run from repo root by mistake.
backend_dir = os.path.dirname(os.path.dirname(__file__))  # .../backend
if backend_dir not in sys.path:
    sys.path.append(backend_dir)

# Import your metadata
from app.models import target_metadata  # noqa: E402

# Set DB URL from env var (do NOT hardcode here)
db_url = os.getenv("DATABASE_URL")
if db_url:
    config.set_main_option("sqlalchemy.url", db_url)

def run_migrations_offline():
    """Run migrations in 'offline' mode."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        compare_type=False,
        compare_server_default=False,
    )
    with context.begin_transaction():
        context.run_migrations()

def run_migrations_online():
    """Run migrations in 'online' mode."""
    connectable = engine_from_config(
        config.get_section(config.config_ini_section),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=False,
            compare_server_default=False,
        )
        with context.begin_transaction():
            context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
