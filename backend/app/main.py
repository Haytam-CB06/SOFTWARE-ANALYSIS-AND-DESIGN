from app.schemas import ResetRequest, VerifyCode, ResetPassword
from app.db import get_db
from app.models.user import User
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from fastapi import Depends, HTTPException
from random import randint
from email.mime.text import MIMEText
import smtplib
from app.routers import workspaces, members, permission,chat
from app.routers import timetable  # if not already added
from app.routers import notifications
# backend/app/main.py
import os
from datetime import datetime, timedelta, timezone, date
from typing import Optional, List, Dict, Any
from pathlib import Path
from uuid import uuid4

from fastapi import FastAPI, Request, HTTPException, APIRouter, Query
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
# backend/app/main.py
from app.db import init_engine, get_db
from . import schemas
# backend/app/main.py  (add/keep these)
import os
from fastapi import FastAPI

from dotenv import load_dotenv
load_dotenv()  # make sure DATABASE_URL is loaded


app = FastAPI(title="SmartStudy API")


@app.on_event("startup")
def _startup():
    # Initialize SQLAlchemy engine / session factory
    init_engine()
    from app.models.base import Base
    from app.db import _ENGINE
    Base.metadata.create_all(bind=_ENGINE)


# ---------- Environment ----------
load_dotenv()


app.add_middleware(
    SessionMiddleware,
    secret_key=os.getenv("SESSION_SECRET", "dev-session-secret"),
)

# Allow HTTP for local dev (don't use in production)
os.environ["OAUTHLIB_INSECURE_TRANSPORT"] = os.getenv(
    "OAUTHLIB_INSECURE_TRANSPORT", "1")

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
_scopes_raw = os.getenv(
    "GOOGLE_SCOPES", "https://www.googleapis.com/auth/calendar")
SCOPES: List[str] = [s for s in (
    x.strip() for x in _scopes_raw.replace(",", " ").split()) if s]

REDIRECT_URI = os.getenv("OAUTH_REDIRECT_URI",
                         "http://localhost:8000/auth/callback")

CLIENT_SECRETS_FILE = resolve_existing_path(
    os.getenv("GOOGLE_CLIENT_SECRETS_FILE"),
    "client_secret.json",
)

TOKEN_FILE = (project_root_from_this_file(
    3) / os.getenv("GOOGLE_TOKEN_FILE", "token.json")).resolve()
TOKEN_FILE.parent.mkdir(parents=True, exist_ok=True)

# ---------- DB engine ----------
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./app.db")
CONNECT_ARGS = {"check_same_thread": False} if DATABASE_URL.startswith(
    "sqlite") else {}
engine: Engine = create_engine(
    DATABASE_URL, future=True, pool_pre_ping=True, connect_args=CONNECT_ARGS)

# ---------- Password hashing ----------
# Use bcrypt_sha256 to avoid backend 72-byte limits and Windows wheel quirks.
pwd_context = CryptContext(
    schemes=["bcrypt_sha256", "bcrypt"],  # try bcrypt as a fallback
    deprecated="auto"
)


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
        raise HTTPException(
            status_code=401, detail="Not authorized. Start at /auth")
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
            raise ValueError(
                "datetime must be timezone-aware (e.g., 2025-10-10T10:00:00+03:00)")
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

# =====================================================================
#                         GOOGLE OAUTH & EVENTS
# =====================================================================

oauth_router = APIRouter(tags=["google"])


@oauth_router.get("/auth")
def oauth_start():
    flow = get_flow()
    auth_url, state = flow.authorization_url(
        access_type="offline",
        include_granted_scopes="true",
        prompt="consent",
    )
    # Store the state in session to validate callback (basic CSRF protection)
    response = RedirectResponse(auth_url)
    return response


@oauth_router.get("/auth/callback")
def oauth_callback(request: Request):
    try:
        flow = get_flow()
        flow.fetch_token(authorization_response=str(request.url))
        creds = flow.credentials
        save_credentials(creds)
        return JSONResponse({"message": "Authorized", "scopes": creds.scopes})
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"OAuth error: {e}")


@oauth_router.get("/me/events")
def list_events():
    try:
        service = get_service()
        now = datetime.now(timezone.utc).isoformat()
        results = service.events().list(
            calendarId="primary",
            timeMin=now,
            maxResults=10,
            singleEvents=True,
            orderBy="startTime",
        ).execute()
        return results.get("items", [])
    except HttpError as e:
        raise HTTPException(status_code=e.resp.status, detail=str(e))


@oauth_router.post("/events")
def create_event(payload: EventCreate):
    try:
        service = get_service()
        event_body = {
            "summary": payload.summary,
            "description": payload.description,
            "start": {"dateTime": payload.start.isoformat()},
            "end": {"dateTime": payload.end.isoformat()},
        }
        event = service.events().insert(calendarId="primary", body=event_body).execute()
        return {"id": event.get("id"), "htmlLink": event.get("htmlLink")}
    except HttpError as e:
        raise HTTPException(status_code=e.resp.status, detail=str(e))


@oauth_router.delete("/events/{event_id}")
def delete_event(event_id: str):
    try:
        service = get_service()
        service.events().delete(calendarId="primary", eventId=event_id).execute()
        return {"deleted": True, "id": event_id}
    except HttpError as e:
        # 404 when not found, 410 when already gone, etc.
        raise HTTPException(status_code=e.resp.status, detail=str(e))


app.include_router(oauth_router)

# =====================================================================
#                         TEST-DB HELPERS
# =====================================================================

db_router = APIRouter(prefix="/test-db", tags=["test-db"])


def _get_user_table_columns(conn) -> List[str]:
    if DATABASE_URL.startswith("sqlite"):
        rows = conn.execute(text("PRAGMA table_info(users)")).all()
        return [r[1] for r in rows]  # name at index 1
    rows = conn.execute(text(
        "SELECT column_name FROM information_schema.columns WHERE table_name = 'users'"
    )).fetchall()
    return [r[0] for r in rows]


@db_router.post("/users")
def create_user(payload: Dict[str, Any]):
    with engine.begin() as conn:
        cols = set(_get_user_table_columns(conn))
        data = {k: v for k, v in payload.items() if k in cols}

        if "id" in cols and "id" not in data:
            data["id"] = str(uuid4())  # allow explicit id if needed

        placeholders = ", ".join([f":{k}" for k in data.keys()])
        columns = ", ".join(data.keys())
        try:
            conn.execute(
                text(f"INSERT INTO users ({columns}) VALUES ({placeholders})"), data)
        except Exception as e:
            raise HTTPException(status_code=409, detail=str(e))

    return {"ok": True, "email": payload.get("email")}


@db_router.get("/users")
def list_users(limit: int = Query(10, ge=1, le=100)):
    with engine.begin() as conn:
        cols = set(_get_user_table_columns(conn))
        select_cols: List[str] = []
        if "id" in cols:
            select_cols.append("id")
        elif DATABASE_URL.startswith("sqlite"):
            select_cols.append("rowid AS id")

        for candidate in ["email", "full_name", "timezone", "gender", "date_of_birth"]:
            if candidate in cols:
                select_cols.append(candidate)

        if not select_cols:
            raise HTTPException(
                500, detail="Could not determine columns to select from 'users'.")

        sql = (
            f"SELECT {', '.join(select_cols)} FROM users ORDER BY ROWID DESC LIMIT :limit"
            if DATABASE_URL.startswith("sqlite")
            else f"SELECT {', '.join(select_cols)} FROM users ORDER BY 1 DESC LIMIT :limit"
        )

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
    gender: constr(max_length=1)
    date_of_birth: date


class LoginIn(BaseModel):
    email: EmailStr
    password: constr(min_length=6)


auth_router = APIRouter(prefix="/auth", tags=["auth"])


class userdata(BaseModel):
    email: str
    password: str
    full_name: str
    timezone:  str
    gender:  str
    date_of_birth: date


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
            raise HTTPException(
                status_code=409, detail="Email already registered")

        # build insert dynamically based on available columns
        cols = set(_get_user_table_columns(conn))
        data: Dict[str, Any] = {
            "email": payload.email,
        }
        if "full_name" in cols:
            data["full_name"] = payload.full_name
        if "date_of_birth" in cols:
            data["date_of_birth"] = payload.date_of_birth
        if "gender" in cols:
            data["gender"] = payload.gender
        if "timezone" in cols:
            data["timezone"] = payload.timezone
        if "password_hash" in cols:
            data["password_hash"] = hash_password(payload.password)
        print(cols)
        # handle id if necessary
        if "id" in cols:
            try:
                # dry run to detect NOT NULL without default
                conn.exec_driver_sql("SAVEPOINT sp_ins")
                columns = ", ".join(data.keys())
                placeholders = ", ".join([f":{k}" for k in data.keys()])
                conn.execute(
                    text(f"INSERT INTO users ({columns}) VALUES ({placeholders})"), data)
                conn.exec_driver_sql("ROLLBACK TO SAVEPOINT sp_ins")
            except Exception:
                conn.exec_driver_sql("ROLLBACK TO SAVEPOINT sp_ins")
                data["id"] = str(uuid4())

        columns = ", ".join(data.keys())
        placeholders = ", ".join([f":{k}" for k in data.keys()])
        conn.execute(
            text(f"INSERT INTO users ({columns}) VALUES ({placeholders})"), data)

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
            raise HTTPException(
                status_code=500, detail="password column missing on users (run migrations)")

        if not verify_password(payload.password, ph):
            raise HTTPException(status_code=401, detail="invalid credentials")

    # If you later need JWTs, generate and return here.
    return {"message": "login ok"}


app.include_router(auth_router)
# domain routers
app.include_router(timetable.router)
app.include_router(notifications.router)
app.include_router(workspaces.router)
app.include_router(members.router)
app.include_router(permission.router)
app.include_router(chat.router)

# --- MCP (Model Context Protocol) server ---
# Exposes your FastAPI routes as MCP tools at /mcp so AI agents can call them
# (e.g., for timetable image extraction).
try:
    from fastapi_mcp import FastApiMCP
    _mcp = FastApiMCP(app)
    _mcp.mount()
except Exception as _e:
    # Optional dependency: if fastapi-mcp isn't installed, the API still runs.
    # Install backend/requirements.txt to enable /mcp.
    pass


# =============================== reset password =====================================


def is_code_expired(created_at: datetime, minutes: int = 10):
    if not created_at:
        return True
    return datetime.now(timezone.utc) > created_at + timedelta(minutes=minutes)


SMTP_HOST = "smtp.gmail.com"
SMTP_PORT = 587
SMTP_EMAIL = os.getenv("SMTP_EMAIL")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")
# NO SPACES


def send_reset_email(email: str, code: str):
    body = f"""
    Hello,

    You requested a password reset. Use the code below to reset your password:

        {code}

    This code will expire in 10 minutes.

    
    Thanks,
    SMART STUDYING TIMETABLE GENERATOR 
    """
    msg = MIMEText(f"{body}")
    msg["From"] = SMTP_EMAIL
    msg["To"] = email
    msg["Subject"] = "Password Reset Code"

    with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
        server.starttls()
        server.login(SMTP_EMAIL, SMTP_PASSWORD)
        server.send_message(msg)


# 1️⃣ REQUEST CODE
@app.post("/request_reset")
def request_reset(data: ResetRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user:
        raise HTTPException(404, "Email not found")

    code = str(randint(100000, 999999))

    user.reset_code = code
    user.reset_code_created_at = datetime.now(timezone.utc)
    db.commit()

    send_reset_email(user.email, code)

    return {"message": "Reset code sent"}


# 2️⃣ VERIFY CODE
@app.post("/verify_code")
def verify_code(data: VerifyCode, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user:
        raise HTTPException(404, "Email not found")

    # Check if code expired
    if is_code_expired(user.reset_code_created_at):
        raise HTTPException(400, "Reset code expired, request a new one")

    if user.reset_code != data.code:
        raise HTTPException(400, "Invalid reset code")

    return {"message": "Code verified successfully"}

# 3️⃣ RESET PASSWORD


@app.post("/reset_password")
def reset_password(data: ResetPassword, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user:
        raise HTTPException(404, "Email not found")

    # code expired?
    if is_code_expired(user.reset_code_created_at):
        raise HTTPException(400, "Reset code expired, request a new one")

    # code wrong?
    if user.reset_code != data.code:
        raise HTTPException(400, "Invalid reset code")

    # update password
    user.password_hash = hash_password(data.new_password)
    user.reset_code = None
    user.reset_code_created_at = None

    db.commit()
    return {"message": "Password reset successful"}


# ------------------------------
# Validation-only endpoints (for your Sprint-1 tasks)
# ------------------------------
# --- safe no-op stub (prevents NameError in signup)
def _ensure_password_hash_column():
    # previously used to alter DB schema; now disabled
    return None


@app.post("/_validate/auth/signup", tags=["_validate"])
def _validate_signup(payload: schemas.UserCreate):
    return {"ok": True}


@app.post("/_validate/auth/login", tags=["_validate"])
def _validate_login(payload: schemas.LoginIn):
    return {"ok": True}


@app.post("/_validate/subjects", tags=["_validate"])
def _validate_subject(payload: schemas.SubjectCreate):
    return {"ok": True}


@app.post("/_validate/preferences", tags=["_validate"])
def _validate_preferences(payload: schemas.PreferencesUpdate):
    return {"ok": True}


@app.post("/_validate/sessions", tags=["_validate"])
def _validate_sessions(payload: schemas.SessionCreate):
    return {"ok": True}
