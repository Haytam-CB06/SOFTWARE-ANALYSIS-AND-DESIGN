import os
from sqlalchemy import engine_from_config, pool
from alembic import context

config = context.config
db_url = os.getenv("DATABASE_URL")
if db_url:
    config.set_main_option("sqlalchemy.url", db_url)
