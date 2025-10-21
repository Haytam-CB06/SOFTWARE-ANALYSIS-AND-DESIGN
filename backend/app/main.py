import os
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import RedirectResponse, JSONResponse
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from google.oauth2.credentials import Credentials
from starlette.middleware.sessions import SessionMiddleware
from pydantic import BaseModel, field_validator
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Calendar API")

app.add_middleware(
    SessionMiddleware,
    secret_key=os.getenv("SESSION_SECRET", "dev-session-secret"),
)

os.environ["OAUTHLIB_INSECURE_TRANSPORT"] = os.getenv("OAUTHLIB_INSECURE_TRANSPORT", "1")

CLIENT_SECRETS_FILE = os.getenv("GOOGLE_CLIENT_SECRETS_FILE", "client_secret.json")
SCOPES = [os.getenv("GOOGLE_SCOPES", "https://www.googleapis.com/auth/calendar")]
REDIRECT_URI = os.getenv("OAUTH_REDIRECT_URI", "http://localhost:8000/auth/callback")
TOKEN_FILE = os.getenv("GOOGLE_TOKEN_FILE", "token.json")


def get_flow(state: Optional[str] = None) -> Flow:
    return Flow.from_client_secrets_file(
        CLIENT_SECRETS_FILE,
        scopes=SCOPES,
        redirect_uri=REDIRECT_URI,
        state=state,
    )


def load_credentials() -> Optional[Credentials]:
    if os.path.exists(TOKEN_FILE):
        return Credentials.from_authorized_user_file(TOKEN_FILE, SCOPES)
    return None


def save_credentials(creds: Credentials):
    with open(TOKEN_FILE, "w") as f:
        f.write(creds.to_json())


def get_service(creds: Optional[Credentials] = None):
    if creds is None:
        creds = load_credentials()
    if not creds:
        raise HTTPException(status_code=401, detail="Not authorized. Start at /auth")
    return build("calendar", "v3", credentials=creds)


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


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.get("/auth")
async def auth(request: Request):
    flow = get_flow()
    auth_url, state = flow.authorization_url(
        prompt="consent",
        include_granted_scopes="true",
        access_type="offline",
    )
    request.session["oauth_state"] = state
    return RedirectResponse(auth_url)


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
