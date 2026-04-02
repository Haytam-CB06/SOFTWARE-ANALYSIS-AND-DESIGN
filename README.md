# Smart Study Timetable Generator  
**Project:** SOFTWARE-ANALYSIS-AND-DESIGN  
**Backend:** FastAPI, PostgreSQL, Alembic  
**Frontend:** React  
**Team Workflow:** SCRUM  

---
# 🧰 1. Project Setup (Quick Start)

## 🔧 Clone Project & Create Virtual Environment
```bash
git clone git@github.com:Haytam-CB06/SOFTWARE-ANALYSIS-AND-DESIGN.git
cd SOFTWARE-ANALYSIS-AND-DESIGN
python -m venv .venv
source .venv/bin/activate  # or .venv\Scripts\activate on Windows
pip install -r requirements.txt
```

## ▶ Frontend
```bash
cd frontend/UPLAN
npm install
npm run dev
```

---

# 🗄️ 2. Database Setup (Postgres)

## ▶ Choose Postgres version then launch shell:
```bash
"C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres
"C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres
"C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres
```

## ▶ Inside psql create DB + user:
```sql
CREATE ROLE smartstudy LOGIN PASSWORD 'changeme';
CREATE DATABASE smartstudy OWNER smartstudy;
\q
```

---

# ⚙️ 3. Backend Configuration (FastAPI + Alembic)

## 📄 Add `.env` inside **backend/**:
```
DATABASE_URL=postgresql+psycopg2://smartstudy:changeme@localhost:5432/smartstudy
```

## ▶ Run migrations
```bash
cd backend
alembic upgrade head
```

This will create/update all required backend tables.

## ▶ Start backend server
```bash
uvicorn app.main:app --reload
```

API Docs:  
👉 http://localhost:8000/docs

### 🖼️ Timetable Image OCR + MCP
- Upload a timetable image to extract days/times/courses:
  - `POST /timetable/extract-image` (multipart/form-data, field: `file`)
- If `fastapi-mcp` is installed, an MCP endpoint is available at:
  - `GET /mcp` (and the MCP schema for agents)

> **Note (Windows):** OCR uses `pytesseract` and requires the Tesseract engine installed + on PATH.

---

# 🧵 6. Background Jobs (Celery + Redis)

This project uses **Celery** for background jobs (email reminders, notification processing). Celery needs a running **Redis** server.

## Redis (Windows) — fastest reliable setup (WSL)

**PowerShell (Admin):**
```powershell
wsl --install
```

Open your Linux distro (Ubuntu/Kali) and run:
```bash
sudo apt update
sudo apt install -y redis-server
sudo service redis-server start
redis-cli ping
```
Expected output:
```
PONG
```

Verify from Windows PowerShell (optional):
```powershell
Test-NetConnection localhost -Port 6379
```

## ▶ Start Celery Worker + Beat (copy/paste)

Open **two terminals** in `backend/` (make sure your venv is activated in both).

### Terminal 1 — Worker (Windows must use solo pool)
```bash
celery -A app.celery_app.celery_app worker --loglevel=INFO --pool=solo
```

### Terminal 2 — Scheduler (Beat)
```bash
celery -A app.celery_app.celery_app beat --loglevel=INFO
```

## 🐳 Alternative: Docker Compose

If you have Docker Desktop installed:
```bash
docker compose up --build
```

## Quick sanity check

Trigger a test email (will enqueue/execute via Celery):
```bash
curl -X POST http://localhost:8000/notifications/test-email \
  -H "Content-Type: application/json" \
  -d '{"to_email":"YOUR_EMAIL_HERE"}'
```

## Env vars needed (minimum)
In `backend/.env` add:
```
REDIS_URL=redis://localhost:6379/0
ENABLE_NOTIFICATION_POLLER=false
```

### Optional: test email endpoint
Once backend + celery worker are running, you can verify email sending:
```bash
curl -X POST http://127.0.0.1:8000/notifications/test-email -H "Content-Type: application/json" -d "{\"to_email\":\"YOUR_EMAIL_HERE\"}"
```

---

# 🧪 4. Test API (Postman)

1. Import: `SSTG_Postman_Collection.json`
2. Set environment variable:
```
base_url = http://localhost:8000
```
3. Test sequence:
   - `GET /health`
   - Auth → signup
   - Auth → login

---

# 📑 5. Database ERD (S1-3)

```mermaid
erDiagram
    USERS ||--o{ SUBJECTS : has
    USERS ||--o{ AVAILABILITY_WINDOWS : defines
    USERS ||--|| PREFERENCES : has_one
    USERS ||--o{ STUDY_SESSIONS : owns
    USERS ||--o{ GOALS : sets
    USERS ||--o{ CALENDAR_ACCOUNTS : links
    USERS ||--o{ NOTIFICATIONS : receives
    USERS ||--o{ ACTIVITY_LOG : generates

    SUBJECTS ||--o{ CLASS_MEETINGS : scheduled_as
    SUBJECTS ||--o{ ASSESSMENTS : has
    SUBJECTS ||--o{ STUDY_SESSIONS : studied_in

    STUDY_SESSIONS ||--o{ SESSION_FEEDBACK : receives
    STUDY_SESSIONS ||--o{ CALENDAR_EVENTS : synced_as
    NOTIFICATIONS }o--|| STUDY_SESSIONS : optional_about

    USERS {
        uuid id PK
        citext email
        text full_name
        text timezone
    }

    PREFERENCES {
        uuid id PK
        uuid user_id FK
        smallint default_session_minutes
        smallint daily_cap_minutes
        smallint weekly_cap_minutes
    }

    SUBJECTS {
        uuid id PK
        uuid user_id FK
        text title
        text code
        smallint difficulty
        boolean is_active
    }

    CLASS_MEETINGS {
        uuid id PK
        uuid subject_id FK
        smallint day_of_week
        time start_time
        time end_time
        text rrule
    }

    ASSESSMENTS {
        uuid id PK
        uuid subject_id FK
        text kind
        text title
        timestamptz due_at
        numeric estimate_hours
    }

    AVAILABILITY_WINDOWS {
        uuid id PK
        uuid user_id FK
        boolean is_blackout
        smallint day_of_week
        time start_time
        time end_time
    }

    STUDY_SESSIONS {
        uuid id PK
        uuid user_id FK
        uuid subject_id FK
        text source
        timestamptz start_at
        timestamptz end_at
        text status
    }

    SESSION_FEEDBACK {
        uuid id PK
        uuid session_id FK
        text completion
        smallint perceived_difficulty
        smallint actual_minutes
    }

    GOALS {
        uuid id PK
        uuid user_id FK
        uuid subject_id FK
        date period_start
        date period_end
        numeric target_hours
        smallint weight
    }

    CALENDAR_ACCOUNTS {
        uuid id PK
        uuid user_id FK
        text provider
        citext account_email
        text refresh_token_ref
        text status
    }

    CALENDAR_EVENTS {
        uuid id PK
        uuid session_id FK
        text provider
        text provider_calendar_id
        text provider_event_id
        text sync_state
    }

    NOTIFICATIONS {
        uuid id PK
        uuid user_id FK
        uuid session_id FK
        text channel
        text template
        timestamptz send_at
        text status
    }

    ACTIVITY_LOG {
        uuid id PK
        uuid user_id FK
        text actor_type
        text action
        text entity_type
        uuid entity_id
        timestamptz created_at
    }
```

---

# 🧱 6. ORM Model Definitions (S1-7)

Models include:

- `User`
- `Subject`
- `AvailabilityWindow`
- `Preference`
- `StudySession`
- `SessionFeedback`
- `Goal`
- `CalendarAccount`
- `CalendarEvent`
- `Notification`
- **Chat Models**:
  - `ChatRoom`
  - `ChatMember`
  - `ChatMessage`

---

# 👨‍💻 7. Developer Setup Script (Optional)

For VSCode or PowerShell users:

```bash
./scripts/dev-setup.sh
```

PowerShell:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force
.\scripts\dev-setup.ps1
```

---

# 💬 8. Team Workflow (SCRUM)

Branch naming:

```
feature/<task-name>
fix/<bug-name>
experiment/<spike-name>
```

Pull Requests must include:

- Summary  
- Files changed  
- Testing steps  
- Migration impact (if any)

---

# 🔒 9. Chat System (Backend)

Includes:

- Chat Rooms  
- Membership  
- Message History  
- WebSocket API  
- REST Endpoints  
- Fully integrated into migrations

## Background Jobs (Celery + Redis)

This project supports background processing with Celery. This is used for:
- sending due email notifications
- periodic reminder rebuild (best-effort)

### Local (non-docker) quickstart
1) Start Redis:
- Windows/macOS/Linux: run Redis (or use Docker)

2) Install deps:
- `pip install -r backend/requirements.txt`

3) Run API:
- `uvicorn app.main:app --reload` (from `backend/`)

4) Run Celery worker (from `backend/`):
- `celery -A app.celery_app.celery_app worker --loglevel=INFO --pool=solo`

5) Run Celery beat (from `backend/`):
- `celery -A app.celery_app.celery_app beat --loglevel=INFO`

Env:
- `REDIS_URL=redis://localhost:6379/0`
- `ENABLE_NOTIFICATION_POLLER=false` (recommended when using Celery Beat)

### Docker Compose quickstart
From repo root:
- `docker compose up --build`
---
# 👮 Global Admin (Admin tab) — Add / Remove Admins

The **Admin** page in the frontend is a **Global Admin** dashboard (user list, activity count, ban/unban, etc.).  
The **Admin** tab only appears for accounts whose **email** is listed in the backend environment variable `ADMIN_EMAILS`.

## How to access the Global Admin page
1) Start backend + frontend.
2) Sign in to the app with Google using your account.
3) If you are a Global Admin, you will see an **Admin** item in the sidebar (shield icon). Click it to open the Global Admin dashboard.

> If you see **“You are not authorized”**, your email is not in `ADMIN_EMAILS` (see next section).

## ➕ Add a teammate as a Global Admin (recommended workflow)
1) Ask the teammate to **sign in once** (so their user exists in the database).
2) In the backend, open your environment file:
   - Local dev: `backend/.env` (or wherever you store backend env vars)
   - Docker: the `.env` used by `docker compose` / the `environment:` section in `docker-compose.yml`
3) Add their email to `ADMIN_EMAILS` (comma-separated):
   ```env
   ADMIN_EMAILS="you@school.edu,teammate1@school.edu,teammate2@school.edu"
   ```
4) **Restart the backend** (FastAPI container/process) so the new env var is loaded.
5) Teammate refreshes the app — the **Admin** tab should now appear.

## ➖ Remove Global Admin access
Remove the email from `ADMIN_EMAILS` and restart the backend.

## Notes / gotchas
- `ADMIN_EMAILS` is checked by the backend on each request; the frontend only *shows* the Admin tab after a successful admin-only call.
- Emails must match the account email exactly (case-insensitive is safest).
- If a user still can’t see the Admin tab after being added:
  - confirm backend restarted,
  - confirm they are logged in with the correct Google account,
  - confirm the backend is pointing to the same database your frontend is using.
