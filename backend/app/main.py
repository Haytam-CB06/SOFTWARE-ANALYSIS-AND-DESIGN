import os
from datetime import datetime, timedelta, timezone
from typing import Optional, List, Dict, Any
from pathlib import Path
from uuid import uuid4

from fastapi import FastAPI, Request, HTTPException, APIRouter, Query, Depends
from fastapi.responses import RedirectResponse, JSONResponse
from starlette.middleware.sessions import SessionMiddleware
from pydantic import BaseModel, field_validator, EmailStr, constr
from dotenv import load_dotenv

# Google APIs
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from google.oauth2.credentials import Credentials

# SQLAlchemy
from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine

# Password hashing
from passlib.context import CryptContext

# ---------- Environment ----------
load_dotenv()

app = FastAPI(title="Calendar API + Auth")

app.add_middleware(
    SessionMiddleware,
    secret_key=os.getenv("SESSION_SECRET", "dev-session-secret"),
)

# Allow HTTP for local dev (don't use in production)
os.environ["OAUTHLIB_INSECURE_TRANSPORT"] = os.getenv("OAUTHLIB_INSECURE_TRANSPORT", "1")

# ---------- Robust path resolution ----------
def project_root_from_this_file(levels_up: int = 3) -> Path:
    """
    Resolve project root by walking up from this file location.
    main.py is at backend/app/main.py -> 3 levels up == project root
    """
    here = Path(__file__).resolve()
    root = here
    for _ in range(levels_up):
        root = root.parent
    return root

def resolve_existing_path(env_value: Optional[str], default_name: str) -> Path:
    """
    Resolve a path to an existing file, trying in order:
      1) env absolute path (as-is, must exist)
      2) env relative -> CWD
      3) env relative -> project root
      4) default_name in CWD
      5) default_name in project root
    Returns the first existing Path; otherwise returns the last tried (project root default) for visibility.
    """
    candidates: List[Path] = []
    proj_root = project_root_from_this_file(3)
    cwd = Path.cwd()

    if env_value:
        env_path = Path(env_value)
        if env_path.is_absolute():
            candidates.append(env_path)
        else:
            candidates.append(cwd / env_path)
            candidates.append(proj_root / env_path)

    # Defaults
    candidates.append(cwd / default_name)
    candidates.append(proj_root / default_name)

    for p in candidates:
        if p.exists():
            return p.resolve()

    # Nothing existed; return the last candidate (project-root default)
    return candidates[-1].resolve()

# ---------- Config (with safe defaults) ----------
_scopes_raw = os.getenv("GOOGLE_SCOPES", "https://www.googleapis.com/auth/calendar")
SCOPES: List[str] = [s for s in (x.strip() for x in _scopes_raw.replace(",", " ").split()) if s]

REDIRECT_URI = os.getenv("OAUTH_REDIRECT_URI", "http://localhost:8000/auth/callback")

CLIENT_SECRETS_FILE = resolve_existing_path(
    os.getenv("GOOGLE_CLIENT_SECRETS_FILE"),
    "client_secret.json",
)

TOKEN_FILE = (project_root_from_this_file(3) / os.getenv("GOOGLE_TOKEN_FILE", "token.json")).resolve()
TOKEN_FILE.parent.mkdir(parents=True, exist_ok=True)

# ---------- DB engine ----------
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./app.db")
CONNECT_ARGS = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine: Engine = create_engine(DATABASE_URL, future=True, pool_pre_ping=True, connect_args=CONNECT_ARGS)

# ---------- Password hashing ----------
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(raw: str) -> str:
    return pwd_context.hash(raw)

def verify_password(raw: str, hashed: str) -> bool:
    return pwd_context.verify(raw, hashed)

# ---------- Startup checks ----------
def _table_has_column(conn, table: str, col: str) -> bool:
    if DATABASE_URL.startswith("sqlite"):
        rows = conn.execute(text(f"PRAGMA table_info({table})")).all()
        names = [r[1] for r in rows]  # (cid, name, type, ...)
        return col in names
    # Postgres path
    rows = conn.execute(
        text(
            "SELECT 1 FROM information_schema.columns "
            "WHERE table_name = :t AND column_name = :c"
        ),
        {"t": table, "c": col},
    ).fetchall()
    return len(rows) > 0

def _ensure_password_hash_column():
    with engine.begin() as conn:
        # Create column if missing
        if not _table_has_column(conn, "users", "password_hash"):
            if DATABASE_URL.startswith("sqlite"):
                # SQLite supports simple ADD COLUMN
                conn.execute(text("ALTER TABLE users ADD COLUMN password_hash VARCHAR(255)"))
            else:
                # Postgres: IF NOT EXISTS
                conn.execute(text("ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255)"))

@app.on_event("startup")
def _on_startup():
    # Verify DB connectivity and ensure password_hash exists
    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))
    _ensure_password_hash_column()

# ---------- Google helpers ----------
def get_flow(state: Optional[str] = None) -> Flow:
    if not CLIENT_SECRETS_FILE.exists():
        raise HTTPException(
            status_code=500,
            detail=f"Google client secrets not found at: {CLIENT_SECRETS_FILE}"
        )
    return Flow.from_client_secrets_file(
        str(CLIENT_SECRETS_FILE),
        scopes=SCOPES,
        redirect_uri=REDIRECT_URI,
        state=state,
    )

def load_credentials() -> Optional[Credentials]:
    if TOKEN_FILE.exists():
        return Credentials.from_authorized_user_file(str(TOKEN_FILE), SCOPES)
    return None

def save_credentials(creds: Credentials):
    TOKEN_FILE.write_text(creds.to_json(), encoding="utf-8")

def get_service(creds: Optional[Credentials] = None):
    if creds is None:
        creds = load_credentials()
    if not creds:
        raise HTTPException(status_code=401, detail="Not authorized. Start at /auth")
    return build("calendar", "v3", credentials=creds)

# ---------- Models for requests ----------
class EventCreate(BaseModel):
    summary: str
    description: Optional[str] = None
    start: datetime
    end: datetime

    @field_validator("start", "end")
    @classmethod
    def must_be_timezone_aware(cls, v: datetime) -> datetime:
        if v.tzinfo is None or v.tzinfo.utcoffset(v) is None:
            raise ValueError("datetime must be timezone-aware (e.g., 2025-10-10T10:00:00+03:00)")
        return v

    @field_validator("end")
    @classmethod
    def end_after_start(cls, v: datetime, info):
        start = info.data.get("start")
        if start and v <= start:
            raise ValueError("end must be after start")
        return v

# ---------- Health ----------
@app.get("/health")
async def health():
    return {
        "status": "ok",
        "client_secrets_exists": CLIENT_SECRETS_FILE.exists(),
        "client_secrets_path": str(CLIENT_SECRETS_FILE),
        "token_path": str(TOKEN_FILE),
        "scopes": SCOPES,
        "redirect_uri": REDIRECT_URI,
        "cwd": str(Path.cwd()),
        "db": DATABASE_URL,
    }

# ---------- OAuth Routes ----------
@app.get("/auth")
async def auth(request: Request):
    try:
        flow = get_flow()
        auth_url, state = flow.authorization_url(
            prompt="consent",
            include_granted_scopes="true",
            access_type="offline",
        )
        request.session["oauth_state"] = state
        return RedirectResponse(auth_url)
    except Exception as e:
        import traceback; traceback.print_exc()
        raise

@app.get("/auth/callback")
async def callback(request: Request):
    sent_state = request.query_params.get("state")
    saved_state = request.session.get("oauth_state")
    if not sent_state or sent_state != saved_state:
        raise HTTPException(status_code=400, detail="Invalid OAuth state")

    flow = get_flow(state=sent_state)
    flow.fetch_token(authorization_response=str(request.url))
    creds = flow.credentials
    save_credentials(creds)

    service = build("calendar", "v3", credentials=creds)

    start = datetime.now(timezone.utc) + timedelta(hours=1)
    end = start + timedelta(hours=1)
    event = {
        "summary": "Study Session: Math",
        "start": {"dateTime": start.isoformat()},
        "end": {"dateTime": end.isoformat()},
    }

    try:
        event_result = service.events().insert(calendarId="primary", body=event).execute()
    except HttpError as e:
        raise HTTPException(status_code=e.resp.status, detail=str(e))

    return JSONResponse(
        {"message": "Event created", "event_link": event_result.get("htmlLink")}
    )

@app.get("/me/events")
async def list_events():
    service = get_service()
    try:
        resp = (
            service.events()
            .list(
                calendarId="primary",
                maxResults=5,
                singleEvents=True,
                orderBy="startTime",
                timeMin=datetime.now(timezone.utc).isoformat(),
            )
            .execute()
        )
    except HttpError as e:
        raise HTTPException(status_code=e.resp.status, detail=str(e))

    return {"authorized": True, "events": resp.get("items", [])}

@app.post("/events")
async def create_event(payload: EventCreate):
    service = get_service()
    body = {
        "summary": payload.summary,
        "description": payload.description,
        "start": {"dateTime": payload.start.isoformat()},
        "end": {"dateTime": payload.end.isoformat()},
    }
    try:
        result = service.events().insert(calendarId="primary", body=body).execute()
    except HttpError as e:
        raise HTTPException(status_code=e.resp.status, detail=str(e))
    return {"id": result.get("id"), "link": result.get("htmlLink")}

@app.delete("/events/{event_id}")
async def delete_event(event_id: str):
    service = get_service()
    try:
        service.events().delete(calendarId="primary", eventId=event_id).execute()
    except HttpError as e:
        raise HTTPException(status_code=e.resp.status, detail=str(e))
    return {"deleted": True, "id": event_id}

# =====================================================================
#                TEMPORARY DB SMOKE TEST ENDPOINTS (users)
# =====================================================================

def _get_user_table_columns(conn) -> List[str]:
    """
    Discover columns of the 'users' table at runtime so we can
    adapt to UUID vs INT ids and optional columns.
    """
    if DATABASE_URL.startswith("sqlite"):
        rows = conn.execute(text("PRAGMA table_info(users)")).all()
        return [r[1] for r in rows]
    rows = conn.execute(
        text("""
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name = 'users'
        """)
    ).all()
    return [r[0] for r in rows]

class UserIn(BaseModel):
    email: EmailStr
    full_name: str
    timezone: str = "UTC"

db_router = APIRouter(prefix="/test-db", tags=["test-db"])

@db_router.post("/users")
def create_user(payload: UserIn):
    """
    Inserts a row into 'users'.
    - If 'id' is required (e.g., UUID PK with no default), we auto-generate one.
    - If 'full_name' or 'timezone' are missing in the table, we omit them.
    """
    with engine.begin() as conn:
        cols = set(_get_user_table_columns(conn))
        data: Dict[str, Any] = {}

        if "email" not in cols:
            raise HTTPException(500, detail="Table 'users' has no 'email' column. Check your migration.")
        data["email"] = payload.email

        if "full_name" in cols:
            data["full_name"] = payload.full_name
        if "timezone" in cols:
            data["timezone"] = payload.timezone

        needs_id = False
        if "id" in cols:
            try:
                conn.exec_driver_sql("SAVEPOINT sp_test")
                placeholders = ", ".join([f":{k}" for k in data.keys()])
                columns = ", ".join(data.keys())
                conn.execute(text(f"INSERT INTO users ({columns}) VALUES ({placeholders})"))
                conn.exec_driver_sql("ROLLBACK TO SAVEPOINT sp_test")
            except Exception:
                needs_id = True
                conn.exec_driver_sql("ROLLBACK TO SAVEPOINT sp_test")
        if "id" in cols and needs_id:
            data["id"] = str(uuid4())

        placeholders = ", ".join([f":{k}" for k in data.keys()])
        columns = ", ".join(data.keys())
        try:
            conn.execute(text(f"INSERT INTO users ({columns}) VALUES ({placeholders})"), data)
        except Exception as e:
            raise HTTPException(status_code=409, detail=str(e))

    return {"ok": True, "email": payload.email}

@db_router.get("/users")
def list_users(limit: int = Query(10, ge=1, le=100)):
    with engine.begin() as conn:
        cols = set(_get_user_table_columns(conn))
        select_cols: List[str] = []
        if "id" in cols:
            select_cols.append("id")
        elif DATABASE_URL.startswith("sqlite"):
            select_cols.append("rowid AS id")

        for candidate in ["email", "full_name", "timezone"]:
            if candidate in cols:
                select_cols.append(candidate)

        if not select_cols:
            raise HTTPException(500, detail="Could not determine columns to select from 'users'.")

        sql = f"SELECT {', '.join(select_cols)} FROM users ORDER BY ROWID DESC LIMIT :limit" \
              if DATABASE_URL.startswith("sqlite") else \
              f"SELECT {', '.join(select_cols)} FROM users ORDER BY 1 DESC LIMIT :limit"

        rows = conn.execute(text(sql), {"limit": limit}).mappings().all()
        return {"count": len(rows), "items": list(rows)}

app.include_router(db_router)

# =====================================================================
#                AUTH (signup/login) for Postman grading
# =====================================================================

class SignUpIn(BaseModel):
    email: EmailStr
    full_name: constr(strip_whitespace=True, min_length=1)
    password: constr(min_length=6)
    timezone: str = "UTC"

class LoginIn(BaseModel):
    email: EmailStr
    password: constr(min_length=6)

auth_router = APIRouter(prefix="/auth", tags=["auth"])

@auth_router.post("/signup")
def signup(payload: SignUpIn):
    with engine.begin() as conn:
        # ensure password_hash column exists (safety if startup hook didn't run)
        _ensure_password_hash_column()

        # check if email exists
        exists = conn.execute(
            text("SELECT 1 FROM users WHERE email = :e LIMIT 1"),
            {"e": payload.email},
        ).fetchone()
        if exists:
            raise HTTPException(status_code=409, detail="Email already registered")

        # build insert dynamically based on available columns
        cols = set(_get_user_table_columns(conn))
        data: Dict[str, Any] = {
            "email": payload.email,
        }
        if "full_name" in cols:
            data["full_name"] = payload.full_name
        if "timezone" in cols:
            data["timezone"] = payload.timezone
        if "password_hash" in cols:
            data["password_hash"] = hash_password(payload.password)

        # handle id if necessary
        if "id" in cols:
            try:
                # dry run to detect NOT NULL without default
                conn.exec_driver_sql("SAVEPOINT sp_ins")
                columns = ", ".join(data.keys())
                placeholders = ", ".join([f":{k}" for k in data.keys()])
                conn.execute(text(f"INSERT INTO users ({columns}) VALUES ({placeholders})"), data)
                conn.exec_driver_sql("ROLLBACK TO SAVEPOINT sp_ins")
            except Exception:
                conn.exec_driver_sql("ROLLBACK TO SAVEPOINT sp_ins")
                data["id"] = str(uuid4())

        columns = ", ".join(data.keys())
        placeholders = ", ".join([f":{k}" for k in data.keys()])
        conn.execute(text(f"INSERT INTO users ({columns}) VALUES ({placeholders})"), data)

    return {"message": "signup ok"}

@auth_router.post("/login")
def login(payload: LoginIn):
    with engine.begin() as conn:
        row = conn.execute(
            text("SELECT password_hash FROM users WHERE email = :e"),
            {"e": payload.email},
        ).mappings().fetchone()

        if row is None:
            raise HTTPException(status_code=401, detail="invalid credentials")

        ph = row.get("password_hash")
        if not ph:
            raise HTTPException(status_code=500, detail="password column missing on users (run migrations)")

        if not verify_password(payload.password, ph):
            raise HTTPException(status_code=401, detail="invalid credentials")

    # If you later need JWTs, generate and return here.
    return {"message": "login ok"}

app.include_router(auth_router)
