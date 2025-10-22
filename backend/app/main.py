import os
from datetime import datetime, timedelta, timezone
from typing import Optional, List
from pathlib import Path

from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import RedirectResponse, JSONResponse
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from google.oauth2.credentials import Credentials
from starlette.middleware.sessions import SessionMiddleware
from pydantic import BaseModel, field_validator
from dotenv import load_dotenv

# ---------- Environment ----------
load_dotenv()

app = FastAPI(title="Calendar API")

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

    # Nothing existed; return the last candidate (project-root default) so /health shows where we looked
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

# ---------- Models ----------
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

# ---------- Routes ----------
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
    }

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
        # Log a clear traceback to the console for debugging
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
