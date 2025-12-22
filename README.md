# Smart Study Timetable Generator  
**Project:** SOFTWARE-ANALYSIS-AND-DESIGN  
**Backend:** FastAPI, PostgreSQL, Alembic  
**Frontend:** React  
**Team Workflow:** SCRUM  

---
pip install psycopg2
pip install authlib httpx
# 🧰 1. Project Setup (Quick Start)

## 🔧 Clone Project & Create Virtual Environment
```bash
git clone git@github.com:Haytam-CB06/SOFTWARE-ANALYSIS-AND-DESIGN.git
cd SOFTWARE-ANALYSIS-AND-DESIGN
python -m venv .venv
source .venv/bin/activate  # or .venv\Scripts\activate on Windows
pip install -r requirements.txt
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
