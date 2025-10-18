# Smart Study Timetable Generator  
**Project:** SOFTWARE-ANALYSIS-AND-DESIGN  

---

## ⚙️ Setup Virtual Environment & Dependencies (SCRUM-29)

**Team Role:** Backend Developer / QA & Documentation  

### Requirements
- Python 3.11+
- Google Cloud Project (with Calendar API enabled)
- `client_secret.json` file (OAuth 2.0 credentials)

### Setup Instructions
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

# SCRUM-35: Google Calendar Integration & QA Setup
## Overview
This sprint introduces the Google Calendar API integration and QA/test setup for the backend service.
It adds:

OAuth 2.0 authentication via Google

Environment-based configuration (.env.example)

Calendar event endpoints (/auth, /auth/callback, /me/events, /events, /events/{id})

Session handling (SessionMiddleware via itsdangerous)

Better error handling and input validation

The previous backend file (main_app_v1.py) has been archived for comparison and can be found at:
📁 archive/main_app_v1.py

🧱 New Dependencies
```bash
makefile

itsdangerous==2.2.0   # Required for SessionMiddleware
google-auth-oauthlib
google-api-python-client
fastapi
uvicorn
```
After pulling the project:

```bash

pip install -r requirements.txt
```
⚙️ Environment Setup
Create a .env file (or copy from .env.example):
```bash
GOOGLE_CLIENT_SECRETS_FILE=client_secret.json
GOOGLE_SCOPES=https://www.googleapis.com/auth/calendar
OAUTH_REDIRECT_URI=http://localhost:8000/auth/callback
OAUTHLIB_INSECURE_TRANSPORT=1
SESSION_SECRET=change-me
```
Ensure that:

Your Google Cloud project has Calendar API enabled

The client_secret.json file is in the project root

▶️ Running the Application
Start the FastAPI app:

```bash
uvicorn main_app:app --reload --port 8000
```

Visit the following endpoints in your browser or Postman:
Endpoint	Description
/health	Verify server is running
/auth	Starts Google OAuth authorization
/auth/callback	Completes authorization and creates a test event
/me/events	Lists your next 5 Google Calendar events
/events (POST)	Creates a new event from JSON input
/events/{id} (DELETE)	Deletes a specified event


✅ QA Testing Steps
Test	Expected Result
/health	Returns {"status":"ok"}
/auth → consent → /auth/callback	Returns {"message":"Event created", "event_link":...}
/me/events	Returns {"authorized": true, "events": [...]}
POST /events	Creates event, returns {"id": "...", "link": "..."}
DELETE /events/{id}	Returns {"deleted": true}
Disable Calendar API	Returns clean JSON error message (not 500)

🗂 Version Control Notes
The old backend (main_app_v1.py) is stored under archive/ for instructor review

The root main_app_v1.py remains ignored to avoid clutter

.gitignore distinguishes root-only ignores (/main_app_v1.py)

👥 Team Git Workflow
All team members should use this consistent workflow:

```bash
# One-time configuration
git config pull.rebase true
git config --global push.autoSetupRemote true

# Keep main branch updated
git checkout main
git fetch origin
git pull --rebase origin main

# Create a new feature branch for a Jira ticket
git checkout -b feat/<JIRA-KEY>-<short-desc>

# Sync your branch regularly
git fetch origin
git pull --rebase origin main
# If conflicts occur:
# git add <files>
# git rebase --continue

# Push and open a PR
git push
```


