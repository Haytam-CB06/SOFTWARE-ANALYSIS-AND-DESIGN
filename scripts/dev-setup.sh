#!/usr/bin/env bash
set -euo pipefail

# ---- Settings ----
DB_USER=smartstudy
DB_PASS=changeme
DB_NAME=smartstudy
HOST=127.0.0.1
PORT=5432

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND="$REPO_ROOT/backend"
VENV="$REPO_ROOT/venv"
ENVFILE="$BACKEND/.env"

# ---- Create venv + deps ----
python -m venv "$VENV"

# Pick the right venv bin dir on Windows vs POSIX
if [ -d "$VENV/Scripts" ]; then
  VENV_BIN="$VENV/Scripts"
else
  VENV_BIN="$VENV/bin"
fi

PY="$VENV_BIN/python"

"$PY" -m pip install --upgrade pip || echo "pip upgrade skipped (Windows lock)"
"$PY" -m pip install -r "$REPO_ROOT/requirements.txt"

# ---- Create role/db if possible (psql must be on PATH) ----
if command -v psql >/dev/null 2>&1; then
  psql -U postgres -h "$HOST" -p "$PORT" -d postgres <<SQL
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = '$DB_USER') THEN
    CREATE ROLE $DB_USER LOGIN PASSWORD '$DB_PASS';
  ELSE
    ALTER ROLE $DB_USER WITH LOGIN PASSWORD '$DB_PASS';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = '$DB_NAME') THEN
    CREATE DATABASE $DB_NAME OWNER $DB_USER;
  END IF;
END
\$\$;
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
SQL
else
  echo "psql not found on PATH; skipping role/db creation. Make sure Postgres is running."
fi

# ---- .env ----
[ -f "$ENVFILE" ] || cp "$BACKEND/.env.example" "$ENVFILE"
DATABASE_URL="DATABASE_URL=postgresql+psycopg://$DB_USER:$DB_PASS@$HOST:$PORT/$DB_NAME"
if grep -q '^DATABASE_URL=' "$ENVFILE"; then
  sed -i.bak "s|^DATABASE_URL=.*|$DATABASE_URL|" "$ENVFILE"
else
  printf "\n%s\n" "$DATABASE_URL" >> "$ENVFILE"
fi

# ---- Alembic ----
cd "$BACKEND"
"$PY" -m alembic upgrade head

# ---- Start API ----
exec "$PY" -m uvicorn app.main:app --reload
