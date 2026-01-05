from app.schemas import ResetRequest, VerifyCode, ResetPassword
from app.db import get_db
from app.models.user import User
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from fastapi import Depends, HTTPException
from random import randint
from email.mime.text import MIMEText
import smtplib
from app.routers import workspaces, permission, chat
from app.routers import workspace_session_status
from app.routers import workspace_auto_generate_config
from app.routers import admin
from app.routers import assessments
from app.routers import timetable  # if not already added
from app.routers import calendar_export
from app.routers import notifications
from app.routers import sessions
from app.routers import user_profile
from app.routers import study_timetables
from app.routers import auto_generate
from app.routers import achievements
from app.routers import goals
from app.models.oauth import OAuthAccount
# backend/app/main.py
import os
import urllib.parse
from datetime import datetime, timedelta, timezone, date
from typing import Optional, List, Dict, Any
from pathlib import Path
from uuid import uuid4

from fastapi import FastAPI, Request, HTTPException, APIRouter, Query
from fastapi.responses import RedirectResponse, JSONResponse
from starlette.middleware.sessions import SessionMiddleware
from pydantic import BaseModel, field_validator, model_validator, EmailStr, constr, Field
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
from starlette.middleware.sessions import SessionMiddleware
from dotenv import load_dotenv
load_dotenv()   # make sure DATABASE_URL is loaded


app = FastAPI(title="SmartStudy API")


@app.on_event("startup")
def _startup():
    # Initialize SQLAlchemy engine / session factory
    init_engine()
    from app.models.base import Base
    from app.db import _ENGINE
    Base.metadata.create_all(bind=_ENGINE)

    # CP-13: optional lightweight notification poller (dev-friendly).
    # In production, prefer CP-15 (proper job infra) instead.
    try:
        from app.services.notification_poller import start_notification_poller

        start_notification_poller()
    except Exception:
        pass

    # Seed achievement catalog (idempotent).
    try:
        from app.db import get_session
        from app.services.achievements import ensure_default_achievements

        _s = get_session()
        try:
            ensure_default_achievements(_s)
        finally:
            _s.close()
    except Exception:
        pass


# ---------- Environment ----------


app.add_middleware(
    SessionMiddleware,
    secret_key=os.getenv("SESSION_SECRET", "dev-session-secret"),
)

# CORS (local dev / frontend)
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=list({
        os.getenv("FRONTEND_ORIGIN", "http://localhost:3000"),
        "http://localhost:3000",
        "http://localhost:5173",  # Vite default
    }),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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


# Load envs from both repo root and backend (support running from different CWDs)
PROJECT_ROOT = project_root_from_this_file(3)
load_dotenv(PROJECT_ROOT / ".env", override=False)
load_dotenv(PROJECT_ROOT / "backend" / ".env", override=False)



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
import os
from fastapi import FastAPI, APIRouter, Request, HTTPException
from fastapi.responses import JSONResponse
from starlette.middleware.sessions import SessionMiddleware
from authlib.integrations.starlette_client import OAuth

# ---------------------------------------------------------------------
# App
# ---------------------------------------------------------------------
# NOTE: Do NOT re-create the FastAPI() instance here.
# The application instance is defined once at the top of this file.
# Re-creating it will drop previously-registered routes (e.g. /health).
# ---------------------------------------------------------------------
# OAuth
# ---------------------------------------------------------------------
oauth = OAuth()


# ---------------------------------------------------------------------
# Router
# ---------------------------------------------------------------------
oauth_router = APIRouter(tags=["google"])
oauth.register(
    name="google",
    client_id=os.getenv("GOOGLE_CLIENT"),
    client_secret=os.getenv("GOOGLE_SECRET"),
    server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
    userinfo_endpoint="https://openidconnect.googleapis.com/v1/userinfo",
    client_kwargs={"scope": "openid email profile"},
)

def get_or_create_google_user(db: Session, user_info: dict):
    email = user_info["email"]
    full_name = user_info.get("name")

    user = db.query(User).filter(User.email == email).first()
    if user:
        return user

    user = User(
        email=email,
        full_name=full_name,
        timezone="UTC",
        date_of_birth=None,
        password_hash=None,
        auth_provider="google",
    )

    db.add(user)
    db.flush()
    return user

@app.get("/debug-env")
def debug_env():
    return {
        "client_id": os.getenv("GOOGLE_CLIENT_ID"),
        "client_secret": bool(os.getenv("GOOGLE_CLIENT_SECRET")),

    }

for key in ["DATABASE_URL", "GOOGLE_CLIENT", "GOOGLE_SECRET"]:
    print(f"{key} = {os.getenv(key)}")

@oauth_router.get("/login")
async def google_login(request: Request):
    redirect_uri = f"{os.getenv('BACKEND_BASE_URL', 'http://localhost:8000')}/callback"
    return await oauth.google.authorize_redirect(request, redirect_uri)

@oauth_router.get("/callback")
async def google_callback(
    request: Request,
    db: Session = Depends(get_db)
):
    token = await oauth.google.authorize_access_token(request)

    resp = await oauth.google.get(
        "https://openidconnect.googleapis.com/v1/userinfo",
        token=token
    )

    user_info = resp.json()

    user = get_or_create_google_user(db, user_info)
    db.commit()  # ensure user exists in DB

    # Record login history so Global Admin "Last sign-in" reflects Google logins too.
    # (Best-effort; never block login.)
    try:
        from app.models.user import LoginHistory
        ip = None
        if request and getattr(request, "client", None):
            ip = getattr(request.client, "host", None)
        db.add(LoginHistory(user_id=user.id, ip_address=ip))
        db.commit()
    except Exception:
        try:
            db.rollback()
        except Exception:
            pass

    # Redirect back to the frontend and pass minimal info via query params.
    # Frontend will store currentUserId/currentUserEmail/currentUserName in localStorage.
    frontend = os.getenv("FRONTEND_ORIGIN", "http://localhost:3000")
    q_email = urllib.parse.quote(user.email or "")
    q_name = urllib.parse.quote(user.full_name or "")
    q_uid = str(user.id)
    return RedirectResponse(f"{frontend}/?oauth=google&user_id={q_uid}&email={q_email}&name={q_name}")


# ---------------------------------------------------------------------
# INCLUDE ROUTER (DO NOT FORGET)
# ---------------------------------------------------------------------
@oauth_router.get("/auth")
def oauth_start(request: Request, user_id: str):
    """Start Google OAuth for Calendar access.

    We **must** use the redirect URI already whitelisted in client_secret.json
    (http://localhost:8000/auth/callback), so this endpoint simply starts the
    flow and stores the `user_id` in the session.
    """
    flow = get_flow()
    auth_url, state = flow.authorization_url(
        access_type="offline",
        include_granted_scopes="true",
        prompt="consent",
    )
    # Store info in session for the callback
    request.session["google_oauth_state"] = state
    request.session["google_oauth_user_id"] = user_id
    return RedirectResponse(auth_url)


@oauth_router.get("/auth/callback")
def oauth_callback(request: Request, db: Session = Depends(get_db)):
    """OAuth callback.

    Saves credentials **per SmartStudy user** so each student can export to their
    own Google Calendar.
    """
    try:
        # Basic CSRF/state check
        expected_state = request.session.get("google_oauth_state")
        user_id = request.session.get("google_oauth_user_id")
        if not expected_state or not user_id:
            raise HTTPException(status_code=400, detail="OAuth session expired. Please try again.")

        # Validate state query param
        got_state = request.query_params.get("state")
        if got_state != expected_state:
            raise HTTPException(status_code=400, detail="Invalid OAuth state.")

        flow = get_flow(state=expected_state)
        flow.fetch_token(authorization_response=str(request.url))
        creds = flow.credentials

        # Persist creds per user
        from app.models.google_calendar_link import GoogleCalendarLink
        link = db.query(GoogleCalendarLink).filter(GoogleCalendarLink.user_id == user_id).first()
        if link is None:
            link = GoogleCalendarLink(user_id=user_id, credentials_json=creds.to_json())
            db.add(link)
        else:
            link.credentials_json = creds.to_json()

        db.commit()

        # Clean session
        request.session.pop("google_oauth_state", None)
        request.session.pop("google_oauth_user_id", None)

        # Send the user back to the frontend (same tab)
        frontend = os.getenv("FRONTEND_ORIGIN", "http://localhost:3000")
        # Return user to the timetable page so they can click Export again.
        return RedirectResponse(f"{frontend}/?page=my-timetable&google=linked")
    except HTTPException:
        raise
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
    # Frontend may send a "username" style field during signup.
    # We only store it if users.username exists in the DB schema.
    username: Optional[constr(strip_whitespace=True, min_length=3, max_length=50)] = None
    full_name: constr(strip_whitespace=True, min_length=1)
    password: constr(min_length=6)
    timezone: str = "UTC"
    gender: constr(max_length=50)
    date_of_birth: date
    invite_token: Optional[str] = None


class LoginIn(BaseModel):
    # Backwards compatible:
    # - older clients: {"email": "...", "password": "..."}
    # - newer clients: {"identifier": "...", "password": "..."}  (email or username)
    identifier: Optional[str] = Field(default=None)
    email: Optional[str] = Field(default=None)
    password: str

    @model_validator(mode="after")
    def ensure_identifier(self):
        if not self.identifier and self.email:
            self.identifier = self.email
        if not self.identifier:
            raise ValueError("identifier (or email) is required")
        return self


auth_router = APIRouter(prefix="/auth", tags=["auth"])


class userdata(BaseModel):
    email: str
    password: str
    full_name: str
    timezone:  str
    gender:  str
    date_of_birth: date
from itsdangerous import URLSafeTimedSerializer
import os

SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key")

serializer = URLSafeTimedSerializer(SECRET_KEY)
SALT = "workspace-invite"
def verify_invite_token(token: str, max_age: int = 600) -> dict:
    return serializer.loads(
        token,
        salt=SALT,
        max_age=max_age
    )

@auth_router.post("/signup")
def signup(payload: SignUpIn):
    with engine.begin() as conn:
        # Ensure schema safety
        _ensure_password_hash_column()

        # 1️⃣ Check if email already exists
        exists = conn.execute(
            text("SELECT id FROM users WHERE email = :e OR full_name = :u LIMIT 1"),
            {"e": payload.email, "u": payload.full_name},
        ).fetchone()

        if exists:
            raise HTTPException(
                status_code=409,
                detail="Email/username already registered"
            )

        # 2️⃣ Build insert payload dynamically
        cols = set(_get_user_table_columns(conn))

        user_id = str(uuid4())

        data: Dict[str, Any] = {
            "id": user_id,
            "email": payload.email,
            "password_hash": hash_password(payload.password),
        }

        if "full_name" in cols:
            data["full_name"] = payload.full_name
        if "username" in cols and payload.username:
            data["username"] = payload.username
        if "date_of_birth" in cols:
            data["date_of_birth"] = payload.date_of_birth
        if "gender" in cols:
            data["gender"] = payload.gender
        if "timezone" in cols:
            data["timezone"] = payload.timezone

        # If the DB schema requires an auth provider, default to local/password signups.
        # (OAuth signups should set this to e.g. 'google' in the relevant flow.)
        if "auth_provider" in cols and not data.get("auth_provider"):
            data["auth_provider"] = "local"

        # 3️⃣ Insert user
        columns = ", ".join(data.keys())
        placeholders = ", ".join([f":{k}" for k in data.keys()])

        conn.execute(
            text(f"INSERT INTO users ({columns}) VALUES ({placeholders})"),
            data,
        )

        # 4️⃣ Handle workspace invite (if present)
        if payload.invite_token:
            try:
                invite = verify_invite_token(payload.invite_token)
            except Exception:
                raise HTTPException(
                    status_code=400,
                    detail="Invalid or expired invite token"
                )

            workspace_id = invite["workspace_id"]
            invited_email = invite["email"]

            # Security check: token email must match signup email
            if invited_email.lower() != payload.email.lower():
                raise HTTPException(
                    status_code=403,
                    detail="Invite token does not match email"
                )

            # Prevent duplicate membership
            exists = conn.execute(
                text("""
                SELECT 1 FROM workspace_members
                WHERE workspace_id = :w AND user_id = :u
                """),
                {"w": workspace_id, "u": user_id},
            ).fetchone()

            if not exists:
                conn.execute(
                    text("""
                    INSERT INTO workspace_members (workspace_id, user_id, role)
                    VALUES (:w, :u, 'member')
                    """),
                    {"w": workspace_id, "u": user_id},
                )

    # 5️⃣ Return clean response (include user_id so frontend can store it)
    return {
        "message": "Signup successful",
        "user_id": user_id,
        "email": payload.email,
        "full_name": payload.full_name,
        "joined_workspace": bool(payload.invite_token),
    }



@auth_router.post("/login")
def login(payload: LoginIn, request: Request):
    ident = payload.identifier or payload.email

    with engine.begin() as conn:
        cols = set(_get_user_table_columns(conn))

        where_parts: List[str] = []
        if "email" in cols:
            where_parts.append("email = :e")
        if "username" in cols:
            where_parts.append("username = :e")
        if "full_name" in cols:
            where_parts.append("full_name = :e")

        if not where_parts:
            raise HTTPException(status_code=500, detail="users table has no searchable identifier columns")

        # Build SELECT list safely
        select_cols: List[str] = []
        if "id" in cols:
            select_cols.append("id")
        elif DATABASE_URL.startswith("sqlite"):
            select_cols.append("rowid AS id")
        else:
            select_cols.append("id")  # fallback

        for c in ["email", "username", "full_name", "password_hash", "auth_provider", "is_banned"]:
            if c in cols:
                select_cols.append(c)

        if "password_hash" not in cols:
            raise HTTPException(status_code=500, detail="users.password_hash column missing")

        sql = f"""
            SELECT {', '.join(select_cols)}
            FROM users
            WHERE {' OR '.join(where_parts)}
            LIMIT 1
        """

        row = conn.execute(text(sql), {"e": ident}).mappings().fetchone()

        if row is None:
            raise HTTPException(status_code=401, detail="invalid username/email ")

        auth_provider = row.get("auth_provider") or "local"
        if auth_provider != "local":
            raise HTTPException(
                status_code=400,
                detail="This account uses Google login. Please sign in with Google."
            )

        # CP-08: ban guard (submission-safe)
        if bool(row.get("is_banned", False)):
            raise HTTPException(status_code=403, detail="This account has been banned")

        if not verify_password(payload.password, row["password_hash"]):
            raise HTTPException(status_code=401, detail="incorrect password")

        # Record login history (best-effort). Used by /admin endpoints.
        try:
            ip = None
            if request and getattr(request, "client", None):
                ip = getattr(request.client, "host", None)
            # IMPORTANT:
            # `login_history.id` is a UUID primary key with an ORM-level default.
            # When we insert via raw SQL, that Python-side default does NOT run,
            # so we must provide the id ourselves (otherwise inserts can fail and
            # Global Admin "Last sign-in" stays empty).
            lh_id = str(uuid4())
            conn.execute(
                text("""
                INSERT INTO login_history (id, user_id, login_time, ip_address)
                VALUES (:id, :u, NOW(), :ip)
                """ if not DATABASE_URL.startswith("sqlite") else """
                INSERT INTO login_history (id, user_id, login_time, ip_address)
                VALUES (:id, :u, CURRENT_TIMESTAMP, :ip)
                """),
                {"id": lh_id, "u": row["id"], "ip": ip},
            )
        except Exception:
            pass

    return {
        "message": "login ok",
        "user_id": str(row["id"]),
        "email": row.get("email") or (payload.email or payload.identifier),
        "full_name": row.get("full_name") or row.get("username") or (payload.email or payload.identifier),
    }



app.include_router(auth_router)
# domain routers
app.include_router(timetable.router)
app.include_router(calendar_export.router)
app.include_router(notifications.router)
app.include_router(sessions.router)
app.include_router(workspaces.router)
app.include_router(workspace_session_status.router)
app.include_router(workspace_auto_generate_config.router)
app.include_router(permission.router)
app.include_router(chat.router)
app.include_router(user_profile.router)
app.include_router(study_timetables.router)
app.include_router(auto_generate.router)
app.include_router(assessments.router)
app.include_router(goals.router)
app.include_router(achievements.router)
app.include_router(admin.router)

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


SMTP_HOST = (os.getenv("SMTP_HOST") or "smtp.gmail.com").strip()
SMTP_PORT_RAW = (os.getenv("SMTP_PORT") or "587").strip()
SMTP_EMAIL = (os.getenv("SMTP_EMAIL") or "").strip() or None
SMTP_PASSWORD = "samkwlrniyfshrhu"


def _smtp_config():
    # Validate config early so routes can fail gracefully with clear errors.
    missing = []
    if not SMTP_EMAIL:
        missing.append("SMTP_EMAIL")
    if not SMTP_PASSWORD:
        missing.append("SMTP_PASSWORD")
    if missing:
        raise HTTPException(
            status_code=400,
            detail=f"SMTP not configured: missing {', '.join(missing)}",
        )

    try:
        port = int(SMTP_PORT_RAW)
    except Exception:
        raise HTTPException(status_code=400, detail=f"Invalid SMTP_PORT: {SMTP_PORT_RAW}")

    return SMTP_HOST, port, SMTP_EMAIL, SMTP_PASSWORD

# NO SPACES


def send_reset_email(email: str, code: str):
    body = f"""
    Hello,

    You requested a password reset. Use the code below to reset your password:

        {code}

    This code will expire in 10 minutes.


    Thanks,
    U Plan
    """
    msg = MIMEText(f"{body}")
    msg["From"] = SMTP_EMAIL
    msg["To"] = email
    msg["Subject"] = "Password Reset Code for U Plan"

    host, port, smtp_email, smtp_password = _smtp_config()

    try:
        with smtplib.SMTP(host, port, timeout=10) as server:
            server.starttls()
            server.login(smtp_email, smtp_password)
            server.send_message(msg)
    except HTTPException:
        # propagate config errors
        raise
    except Exception as e:
        # Don't crash the server; return a clear error response.
        raise HTTPException(status_code=500, detail="Failed to send reset email via SMTP.")



# 1️⃣ REQUEST CODE
@app.post("/request_reset")
def request_reset(data: ResetRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user:
        raise HTTPException(404, "Email not found")

    code = str(randint(100000, 999999))

    user.reset_code = code
    user.reset_code_created_at = datetime.now(timezone.utc)

    try:
        # Send first; only persist if email send succeeds.
        send_reset_email(user.email, code)
        db.commit()
    except HTTPException:
        db.rollback()
        raise
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to process reset request.")

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

class ChangePasswordRequest(BaseModel): 
    email: str
    current_password: str    
    new_password: str  
    confirm_password: str 


@app.put("/change-password")
def change_password(data: ChangePasswordRequest, db: Session = Depends(get_db)):
    print("✅ CHANGE PASSWORD HIT:", data.email)

    user = db.query(User).filter((User.email == data.email) | (User.full_name == data.email)).first()
    if not user:
        print("❌ USER NOT FOUND")
        raise HTTPException(status_code=404, detail="User not found. Please try again.")

    if not verify_password(data.current_password, user.password_hash):
        print("❌ WRONG CURRENT PASSWORD")
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    if data.current_password == data.new_password:
        print("❌ SAME PASSWORD")
        raise HTTPException(status_code=400, detail="New password must be different")

    if data.new_password != data.confirm_password:
        print("❌ PASSWORDS DO NOT MATCH")
        raise HTTPException(status_code=400, detail="Passwords do not match")

    user.password_hash = hash_password(data.new_password)
    db.commit()

    print("✅ PASSWORD UPDATED SUCCESSFULLY")
    return {"message": "Password changed successfully"}




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
