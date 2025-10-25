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

# S1-3 (Design ERD)

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
# S1-7: Define ORM models
## Teammate Quickstart
Prereqs

Python 3.10+, pip, virtualenv
Postgres 16+ (local or Docker)

Create DB (local Postgres)
On Powershell: 

If you prefer to drop into the Postgres 16 shell first: run
```bash
& "C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres
```
If you prefer to drop into the Postgres 17 shell first: run
```bash
& "C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres
```
If you prefer to drop into the Postgres 18 shell first: run
```bash
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres
```
Then inside the psql prompt (you’ll see something like postgres=#), run:
```bash
CREATE ROLE smartstudy LOGIN PASSWORD 'changeme';
CREATE DATABASE smartstudy OWNER smartstudy;
\q
```

Then go back to your git bash directory to run this command in the folder directory: SOFTWARE-ANALYSIS-AND-DESIGN (main)
```bash
./scripts/dev-setup.sh
```

Postman

Import SSTG_Postman_Collection.json.
Set base_url env var to http://localhost:8000.
Run: GET /health → then Auth folder: signup → login.
