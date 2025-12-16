"""Alembic environment configuration."""
import sys
from pathlib import Path
from logging.config import fileConfig

from sqlalchemy import engine_from_config, pool
from alembic import context

# ==================================================
# STEP 1: Add backend folder to sys.path
# ==================================================
print("=" * 50)
print("STEP 1: Adding backend to sys.path")
backend_dir = Path(__file__).resolve().parent.parent  # .../backend
print(f"  backend_dir: {backend_dir}")
sys.path.insert(0, str(backend_dir))
print(f"  sys.path[0]: {sys.path[0]}")
print("=" * 50)

# ==================================================
# STEP 2: Import Base from app.models.base
# ==================================================
print("STEP 2: Importing Base from app.models.base")
try:
    from app.models.base import Base   # 👈 DO NOT CHANGE THIS LINE
    target_metadata = Base.metadata
    print("  ✓ Base imported successfully")
except Exception as e:
    print(f"  ✗ FAILED: {e}")
    raise
print("=" * 50)

# ==================================================
# STEP 3: Alembic config
# ==================================================
print("STEP 3: Setting up Alembic config")
config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)
    print(f"  ✓ Config file loaded: {config.config_file_name}")
print("=" * 50)

# ==================================================
# STEP 4: target_metadata
# ==================================================
print("STEP 4: Setting target_metadata")
target_metadata = Base.metadata
print(f"  ✓ target_metadata set: {target_metadata}")
print("=" * 50)


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    print("STEP 5: Running offline migrations")
    import os
    url = os.getenv("DATABASE_URL")
    config.set_main_option("sqlalchemy.url", url)
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    print("STEP 5: Running online migrations")
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
        )

        with context.begin_transaction():
            context.run_migrations()


print("FINAL: Checking if offline or online mode")
if context.is_offline_mode():
    print("  → OFFLINE MODE")
    run_migrations_offline()
else:
    print("  → ONLINE MODE")
    run_migrations_online()

print("=" * 50)
print("✓ Migration complete!")
print("=" * 50)
