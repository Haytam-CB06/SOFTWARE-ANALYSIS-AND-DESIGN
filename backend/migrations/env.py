from __future__ import annotations

# make the 'app' package importable when running alembic from backend/
import os, sys
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from logging.config import fileConfig
from sqlalchemy import engine_from_config, pool, text
from alembic import context

# Alembic config
config = context.config
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# DB URL from alembic.ini (hard-coded) or env fallback
db_url = os.getenv("DATABASE_URL", "postgresql+psycopg://smartstudy:changeme@localhost:5432/smartstudy")
config.set_main_option("sqlalchemy.url", db_url)

# ---- IMPORTANT: ensure ALL model modules are imported so Base.metadata is populated
import importlib, pkgutil
import app.models as models_pkg

for _finder, _name, _ispkg in pkgutil.iter_modules(models_pkg.__path__):
    importlib.import_module(f"app.models.{_name}")

from app.models.base import Base
target_metadata = Base.metadata
# ----------------------------------------------------

def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        compare_type=True,
        compare_server_default=True,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()

def run_migrations_online() -> None:
    connectable = engine_from_config(
        config.get_section(config.config_ini_section),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
        future=True,
    )
    with connectable.connect() as connection:
        connection.execute(text("SELECT 1"))
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
            compare_server_default=True,
        )
        with context.begin_transaction():
            context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
