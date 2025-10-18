## SOFTWARE-ANALYSIS-AND-DESIGN
# Smart Study Time-table Generator

# Setup virtual environment / dependencies (SCRUM-29)

## Requirements
- Python 3.11+
- Virtual environment

## Setup Instructions
```bash
git clone git@github.com:Haytam-CB06/SOFTWARE-ANALYSIS-AND-DESIGN.git
cd SOFTWARE-ANALYSIS-AND-DESIGN
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main_app:app --reload --port 8000
```
## Database Setup (PostgreSQL)
## Sign-in / Sign-up Database (PostgreSQL 16)

This branch introduced a bootstrap SQL dump for local setup.

**Dump location**
- `db/dumps/sign-in-up.sql`  <!-- if it’s at the repo root, change this path accordingly -->

**Local environment variables**

**Requirements**
- PostgreSQL 16.x
- psql in PATH
- (Optional) pgAgent if you plan to use DB-side scheduling

DB_HOST=localhost
DB_PORT=5432
DB_NAME=appdb
DB_USER=appuser
DB_PASSWORD=changeme


**Create role & database**
```bash
psql -U postgres -h $DB_HOST -p $DB_PORT -c "CREATE ROLE $DB_USER LOGIN PASSWORD '$DB_PASSWORD';"
psql -U postgres -h $DB_HOST -p $DB_PORT -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;"
```

(Optional) Restore the dump
```bash
psql -U $DB_USER -h $DB_HOST -p $DB_PORT -d $DB_NAME -f db/dumps/sign-in-up.sql
```

Notes:

The dump may include pgagent/adminpack extensions. These are not required for core app logic.

Prefer migrations (e.g., Alembic) for schema changes going forward. Dumps are for bootstrapping only.
