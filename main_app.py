from fastapi import FastAPI, Request
from fastapi.responses import RedirectResponse
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
import os

app = FastAPI()

os.environ["OAUTHLIB_INSECURE_TRANSPORT"] = "1"

CLIENT_SECRETS_FILE = "client_secret.json"
SCOPES = ["https://www.googleapis.com/auth/calendar"]

@app.get("/auth")
def auth():
    flow = Flow.from_client_secrets_file(
        CLIENT_SECRETS_FILE,
        scopes=SCOPES,
        redirect_uri="http://localhost:8000/auth/callback"
    )
    auth_url, _ = flow.authorization_url(prompt="consent")
    return RedirectResponse(auth_url)

@app.get("/auth/callback")
def callback(request: Request):
    flow = Flow.from_client_secrets_file(
        CLIENT_SECRETS_FILE,
        scopes=SCOPES,
        redirect_uri="http://localhost:8000/auth/callback"
    )
    flow.fetch_token(authorization_response=str(request.url))
    credentials = flow.credentials

    service = build("calendar", "v3", credentials=credentials)
    
    event = {
        'summary': 'Study Session: Math',
        'start': {'dateTime': '2025-10-10T10:00:00', 'timeZone': 'Europe/Istanbul'},
        'end': {'dateTime': '2025-10-10T12:00:00', 'timeZone': 'Europe/Istanbul'},
    }

    event_result = service.events().insert(calendarId='primary', body=event).execute()
    return {"message": "Event created", "event_link": event_result.get("htmlLink")}
