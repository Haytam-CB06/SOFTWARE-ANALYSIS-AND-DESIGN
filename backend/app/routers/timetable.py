from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from sqlalchemy.orm import Session, selectinload
from sqlalchemy import and_, or_
from app.db import get_db
from app.models.class_meeting import ClassMeeting
from app.models.subject import Subject
from app.models.user import User
from pydantic import BaseModel, field_validator
from datetime import time
from typing import List, Optional
import uuid
import base64
import csv

router = APIRouter(prefix="/timetable", tags=["Timetable"])

# Pydantic Models


class ClassMeetingCreate(BaseModel):
    subject_id: str
    day_of_week: int  # 0-6
    start_time: str  # "09:00"
    end_time: str
    rrule: Optional[str] = None


class ClassMeetingUpdate(BaseModel):
    day_of_week: Optional[int] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    rrule: Optional[str] = None


class SubjectCreate(BaseModel):
    title: str
    code: Optional[str] = None
    difficulty: Optional[int] = None
    target_grade: Optional[str] = None
    credit_weight: Optional[float] = None

# READ ENDPOINTS


@router.get("/user/{user_id}")
def get_user_timetable(user_id: str, session: Session = Depends(get_db)):
    """
    Kullanıcının haftalık ders programını optimize edilmiş tek sorguda döner.
    """
    try:
        uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid user_id format")

    # Optimize: selectinload ile N+1 sorgusu önlenir
    subjects = (
        session.query(Subject)
        .options(selectinload(Subject.class_meetings))
        .filter(Subject.user_id == user_id, Subject.is_active == True)
        .all()
    )

    if not subjects:
        raise HTTPException(
            status_code=404, detail="No timetable found for this user")

    # Sonuçları formatla
    timetable = []
    for subject in subjects:
        for meeting in subject.class_meetings:
            timetable.append({
                "meeting_id": str(meeting.id),
                "subject_id": str(subject.id),
                "subject_title": subject.title,
                "subject_code": subject.code,
                "day_of_week": meeting.day_of_week,
                "start_time": meeting.start_time.strftime("%H:%M"),
                "end_time": meeting.end_time.strftime("%H:%M"),
                "rrule": meeting.rrule,
            })

    
    timetable.sort(key=lambda x: (x["day_of_week"], x["start_time"]))

    return {"user_id": user_id, "timetable": timetable}


@router.get("/user/{user_id}/day/{day}")
def get_user_timetable_by_day(
    user_id: str,
    day: int,
    session: Session = Depends(get_db)
):
    """
    Belirli bir günün ders programını döner.
    day: 0=Pazar, 6=Cumartesi
    """
    try:
        uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid user_id format")

    meetings = (
        session.query(ClassMeeting)
        .join(Subject, Subject.id == ClassMeeting.subject_id)
        .options(selectinload(ClassMeeting.subject))
        .filter(
            Subject.user_id == user_id,
            Subject.is_active == True,
            ClassMeeting.day_of_week == day
        )
        .order_by(ClassMeeting.start_time)
        .all()
    )

    if not meetings:
        return {"day": day, "meetings": []}

    result = [
        {
            "meeting_id": str(m.id),
            "subject_title": m.subject.title,
            "subject_code": m.subject.code,
            "start_time": m.start_time.strftime("%H:%M"),
            "end_time": m.end_time.strftime("%H:%M"),
            "rule": m.rule,
        }
        for m in meetings
    ]

    return {"day": day, "meetings": result}


@router.get("/admin/all-users")
def get_all_users_timetables(session: Session = Depends(get_db)):
    """
    Admin: Tüm kullanıcıların ders programlarını döner.
    """
    users = (
        session.query(User)
        .options(selectinload(User.subjects).selectinload(Subject.class_meetings))
        .all()
    )

    if not users:
        return {"users": []}

    result = []
    for user in users:
        user_data = {
            "user_id": str(user.id),
            "username": user.username,
            "email": user.email,
            "subjects": []
        }
        for subject in user.subjects:
            if subject.is_active:
                user_data["subjects"].append({
                    "subject_id": str(subject.id),
                    "title": subject.title,
                    "meetings": [
                        {
                            "day": m.day_of_week,
                            "start": m.start_time.strftime("%H:%M"),
                            "end": m.end_time.strftime("%H:%M"),
                        }
                        for m in subject.class_meetings
                    ]
                })
        result.append(user_data)

    return {"users": result}


# WRITE ENDPOINTS

@router.post("/subject")
def create_subject(
    user_id: str,
    subject: SubjectCreate,
    session: Session = Depends(get_db)
):
    """
    Yeni ders ekle.
    """
    try:
        user_uuid = uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid user_id format")

    try:
        # Kullanıcı var mı kontrol et
        user = session.query(User).filter(User.id == user_uuid).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        new_subject = Subject(
            id=uuid.uuid4(),
            user_id=user_uuid,
            title=subject.title,
            code=subject.code,
            difficulty=subject.difficulty,
            target_grade=subject.target_grade,
            credit_weight=subject.credit_weight,
        )

        session.add(new_subject)
        session.commit()
        session.refresh(new_subject)

        return {
            "subject_id": str(new_subject.id),
            "title": new_subject.title,
            "message": "Subject created successfully"
        }
    except Exception as e:
        session.rollback()
        raise HTTPException(
            status_code=500, detail=f"Database error: {str(e)}")
    finally:
        session.close()


@router.post("/meeting")
def create_class_meeting(
    user_id: str,
    meeting: ClassMeetingCreate,
    session: Session = Depends(get_db)
):
    """
    Ders programına yeni saat ekle.
    """
    try:
        subject_uuid = uuid.UUID(meeting.subject_id)
        user_uuid = uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid UUID format")

    # Subject'in bu user'a ait olduğunu kontrol et
    subject = (
        session.query(Subject)
        .filter(Subject.id == subject_uuid, Subject.user_id == user_uuid)
        .first()
    )
    if not subject:
        raise HTTPException(
            status_code=404, detail="Subject not found for this user")

    # Saatleri parse et
    try:
        start_time = time.fromisoformat(meeting.start_time)
        end_time = time.fromisoformat(meeting.end_time)
    except ValueError:
        raise HTTPException(
            status_code=400, detail="Invalid time format. Use HH:MM")

    if start_time >= end_time:
        raise HTTPException(
            status_code=400, detail="Start time must be before end time")

    new_meeting = ClassMeeting(
        id=uuid.uuid4(),
        subject_id=subject_uuid,
        day_of_week=meeting.day_of_week,
        start_time=start_time,
        end_time=end_time,
        rrule=meeting.rrule,
    )

    session.add(new_meeting)
    session.commit()
    session.refresh(new_meeting)

    return {
        "meeting_id": str(new_meeting.id),
        "subject_id": str(new_meeting.subject_id),
        "day": new_meeting.day_of_week,
        "start_time": new_meeting.start_time.strftime("%H:%M"),
        "end_time": new_meeting.end_time.strftime("%H:%M"),
        "message": "Meeting created successfully"
    }


@router.put("/meeting/{meeting_id}")
def update_class_meeting(
    meeting_id: str,
    user_id: str,
    update_data: ClassMeetingUpdate,
    session: Session = Depends(get_db)
):
    
    try:
        meeting_uuid = uuid.UUID(meeting_id)
        user_uuid = uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid UUID format")

    # Meeting'i bul ve user'a ait olduğunu kontrol et
    meeting = (
        session.query(ClassMeeting)
        .join(Subject, Subject.id == ClassMeeting.subject_id)
        .filter(ClassMeeting.id == meeting_uuid, Subject.user_id == user_uuid)
        .first()
    )
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    # Güncelle
    if update_data.day_of_week is not None:
        meeting.day_of_week = update_data.day_of_week
    if update_data.start_time is not None:
        meeting.start_time = time.fromisoformat(update_data.start_time)
    if update_data.end_time is not None:
        meeting.end_time = time.fromisoformat(update_data.end_time)
    if update_data.rrule is not None:
        meeting.rule = update_data.rrule

    session.commit()

    return {
        "meeting_id": str(meeting.id),
        "message": "Meeting updated successfully"
    }


@router.delete("/meeting/{meeting_id}")
def delete_class_meeting(
    meeting_id: str,
    user_id: str,
    session: Session = Depends(get_db)
):
    
    try:
        meeting_uuid = uuid.UUID(meeting_id)
        user_uuid = uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid UUID format")

    meeting = (
        session.query(ClassMeeting)
        .join(Subject, Subject.id == ClassMeeting.subject_id)
        .filter(ClassMeeting.id == meeting_uuid, Subject.user_id == user_uuid)
        .first()
    )
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    session.delete(meeting)
    session.commit()

    return {"message": "Meeting deleted successfully"}


@router.delete("/subject/{subject_id}")
def delete_subject(
    subject_id: str,
    user_id: str,
    session: Session = Depends(get_db)
):
    
    try:
        subject_uuid = uuid.UUID(subject_id)
        user_uuid = uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid UUID format")

    subject = (
        session.query(Subject)
        .filter(Subject.id == subject_uuid, Subject.user_id == user_uuid)
        .first()
    )
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")

    session.delete(subject)
    session.commit()

    return {"message": "Subject deleted successfully"}

# ===============================
# Image -> Timetable extraction (OCR)
# ===============================

import io
import re
from PIL import Image

try:
    import pytesseract  # type: ignore
except Exception:  # pragma: no cover
    pytesseract = None


class TimetableExtractItem(BaseModel):
    """A single extracted row from an uploaded timetable image."""

    day_of_week: Optional[int] = None  # 0-6 (Sun..Sat) if we can infer
    day_label: Optional[str] = None
    start_time: Optional[str] = None  # HH:MM
    end_time: Optional[str] = None
    subject_title: Optional[str] = None
    subject_code: Optional[str] = None
    raw_line: Optional[str] = None


class TimetableExtractResponse(BaseModel):
    text: str
    items: List[TimetableExtractItem]


_DAY_MAP = {
    "sun": 0,
    "sunday": 0,
    "mon": 1,
    "monday": 1,
    "tue": 2,
    "tues": 2,
    "tuesday": 2,
    "wed": 3,
    "wednesday": 3,
    "thu": 4,
    "thur": 4,
    "thurs": 4,
    "thursday": 4,
    "fri": 5,
    "friday": 5,
    "sat": 6,
    "saturday": 6,
}


_TIME_RANGE_RE = re.compile(
    r"(?P<s>\b\d{1,2}[:\.]\d{2}\b)\s*[-–—]\s*(?P<e>\b\d{1,2}[:\.]\d{2}\b)",
    flags=re.IGNORECASE,
)


def _norm_time(t: str) -> str:
    # Accept 9.00, 9:00, 09:00
    t = t.strip().replace(".", ":")
    hh, mm = t.split(":", 1)
    return f"{int(hh):02d}:{int(mm):02d}"


def _infer_day(line: str) -> tuple[Optional[int], Optional[str]]:
    lower = re.sub(r"[^a-z]", " ", line.lower())
    tokens = [t for t in lower.split() if t]
    for tok in tokens:
        if tok in _DAY_MAP:
            return _DAY_MAP[tok], tok
    return None, None


def _infer_subject(line: str, time_span: tuple[str, str] | None) -> tuple[Optional[str], Optional[str]]:
    # Very lightweight heuristic:
    # - remove detected time range
    # - remove common day tokens
    # - try to split CODE (e.g., CSE101, MATH-201) from title
    cleaned = line
    if time_span:
        s, e = time_span
        cleaned = cleaned.replace(s, " ").replace(e, " ")
    for k in _DAY_MAP.keys():
        cleaned = re.sub(rf"\b{k}\b", " ", cleaned, flags=re.IGNORECASE)

    cleaned = re.sub(r"\s+", " ", cleaned).strip(" -|\t")

    # Find a code-like token
    m = re.search(r"\b([A-Z]{2,10}\s?[-]?\s?\d{2,4}[A-Z]?)\b", cleaned)
    code = None
    if m:
        code = re.sub(r"\s+", "", m.group(1)).replace("-", "")
        title = (cleaned[:m.start()] + " " + cleaned[m.end():]).strip()
    else:
        title = cleaned

    title = re.sub(r"\s+", " ", title).strip() or None
    return title, code


@router.post("/extract-image", response_model=TimetableExtractResponse)
async def extract_timetable_from_image(file: UploadFile = File(...)):
    """Extract timetable-like text from an uploaded image.

    Notes:
    - This uses OCR (pytesseract). On Windows you must install the Tesseract engine
      and ensure it's on PATH (or set pytesseract.pytesseract.tesseract_cmd).
    - The parsing is heuristic; frontend/user may confirm and edit extracted results.
    """

    if pytesseract is None:
        raise HTTPException(
            status_code=500,
            detail="pytesseract is not installed on the server. Install dependencies (see backend/requirements.txt).",
        )

    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Please upload an image file.")

    data = await file.read()
    try:
        img = Image.open(io.BytesIO(data)).convert("RGB")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid image: {e}")

    text = pytesseract.image_to_string(img)
    lines = [ln.strip() for ln in text.splitlines() if ln.strip()]

    items: List[TimetableExtractItem] = []
    for ln in lines:
        day_idx, day_label = _infer_day(ln)
        m = _TIME_RANGE_RE.search(ln)
        time_span = None
        start_time = end_time = None
        if m:
            start_time = _norm_time(m.group("s"))
            end_time = _norm_time(m.group("e"))
            time_span = (m.group("s"), m.group("e"))

        title, code = _infer_subject(ln, time_span)

        # Only keep rows that look somewhat timetable-ish
        if start_time or end_time or day_idx is not None:
            items.append(
                TimetableExtractItem(
                    day_of_week=day_idx,
                    day_label=day_label,
                    start_time=start_time,
                    end_time=end_time,
                    subject_title=title,
                    subject_code=code,
                    raw_line=ln,
                )
            )

    return TimetableExtractResponse(text=text, items=items)


class TimetableExtractBase64In(BaseModel):
    """MCP/agent-friendly image input.

    Accepts either:
    - raw base64 (no prefix)
    - a data URL (e.g. 'data:image/png;base64,...')
    """

    image_base64: str


@router.post("/extract-image-base64", response_model=TimetableExtractResponse)
def extract_timetable_from_image_base64(payload: TimetableExtractBase64In):
    """Extract timetable-like text from a base64-encoded image.

    Why this exists:
    - UploadFile/multipart is awkward for MCP tools. JSON input works much better.
    """

    if pytesseract is None:
        raise HTTPException(
            status_code=500,
            detail="pytesseract is not installed on the server. Install dependencies (see backend/requirements.txt).",
        )

    b64 = payload.image_base64.strip()
    # Allow data URLs
    if b64.lower().startswith("data:") and "," in b64:
        b64 = b64.split(",", 1)[1]

    try:
        raw = base64.b64decode(b64, validate=True)
    except Exception:
        # Some clients send base64 with newlines/spaces; retry a more tolerant decode.
        try:
            raw = base64.b64decode(re.sub(r"\s+", "", b64))
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid base64 image: {e}")

    try:
        img = Image.open(io.BytesIO(raw)).convert("RGB")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid image: {e}")

    text = pytesseract.image_to_string(img)
    lines = [ln.strip() for ln in text.splitlines() if ln.strip()]

    items: List[TimetableExtractItem] = []
    for ln in lines:
        day_idx, day_label = _infer_day(ln)
        m = _TIME_RANGE_RE.search(ln)
        time_span = None
        start_time = end_time = None
        if m:
            start_time = _norm_time(m.group("s"))
            end_time = _norm_time(m.group("e"))
            time_span = (m.group("s"), m.group("e"))

        title, code = _infer_subject(ln, time_span)

        if start_time or end_time or day_idx is not None:
            items.append(
                TimetableExtractItem(
                    day_of_week=day_idx,
                    day_label=day_label,
                    start_time=start_time,
                    end_time=end_time,
                    subject_title=title,
                    subject_code=code,
                    raw_line=ln,
                )
            )

    return TimetableExtractResponse(text=text, items=items)


# ===============================
# CSV timetable extraction
# ===============================

class TimetableCsvTextRequest(BaseModel):
    """MCP/agent-friendly CSV input (no multipart)."""
    csv: str


def _day_to_int(val: str | int | None) -> Optional[int]:
    if val is None:
        return None
    s = str(val).strip()
    if not s:
        return None
    if s.isdigit():
        d = int(s)
        return d if 0 <= d <= 6 else None
    key = re.sub(r"[^a-z]", "", s.lower())
    if key in _DAY_MAP:
        return _DAY_MAP[key]
    # try first 3 letters
    if len(key) >= 3 and key[:3] in _DAY_MAP:
        return _DAY_MAP[key[:3]]
    return None


def _read_csv_text(raw: str) -> TimetableExtractResponse:
    """Parse CSV text into TimetableExtractResponse.
    Expected columns (case-insensitive):
      - day / day_of_week
      - start / start_time
      - end / end_time
      - subject / title (optional if code provided)
      - code / subject_code (optional)
    """
    f = io.StringIO(raw)
    reader = csv.DictReader(f)
    if not reader.fieldnames:
        raise HTTPException(status_code=400, detail="CSV has no headers/columns")

    # normalize header names
    def norm(h: str) -> str:
        return re.sub(r"[^a-z_]", "", h.strip().lower())

    headers = {norm(h): h for h in reader.fieldnames}

    def get(row, *names):
        for n in names:
            k = norm(n)
            if k in headers:
                return row.get(headers[k])
        return None

    items: list[TimetableExtractItem] = []
    for row in reader:
        day = _day_to_int(get(row, "day", "day_of_week"))
        start_raw = get(row, "start", "start_time")
        end_raw = get(row, "end", "end_time")
        if not start_raw or not end_raw:
            # skip empty lines
            continue
        try:
            start = _norm_time(str(start_raw))
            end = _norm_time(str(end_raw))
        except Exception:
            raise HTTPException(status_code=400, detail=f"Invalid time format in row: {row}")

        code = get(row, "code", "subject_code")
        title = get(row, "subject", "title", "course", "course_title")

        items.append(
            TimetableExtractItem(
                day_of_week=day,
                start_time=start,
                end_time=end,
                subject_title=str(title).strip() if title else None,
                subject_code=str(code).strip() if code else None,
                raw_line=",".join([str(row.get(h, "")).strip() for h in reader.fieldnames]),
            )
        )

    return TimetableExtractResponse(text=raw, items=items)


@router.post("/extract-csv", response_model=TimetableExtractResponse)
async def extract_timetable_from_csv(file: UploadFile = File(...)):
    """Upload a CSV and extract timetable rows."""
    if not file.filename.lower().endswith(".csv"):
        # still allow if content-type is csv
        if file.content_type not in ("text/csv", "application/csv", "application/vnd.ms-excel"):
            raise HTTPException(status_code=400, detail="Please upload a .csv file")

    raw_bytes = await file.read()
    try:
        raw = raw_bytes.decode("utf-8")
    except UnicodeDecodeError:
        raw = raw_bytes.decode("utf-8-sig", errors="replace")

    return _read_csv_text(raw)


@router.post("/extract-csv-text", response_model=TimetableExtractResponse)
async def extract_timetable_from_csv_text(payload: TimetableCsvTextRequest):
    """JSON CSV input (no multipart) - suitable for MCP clients."""
    return _read_csv_text(payload.csv)


# ===============================
# Course importance (difficulty) update
# ===============================


class SubjectImportanceUpdate(BaseModel):
    """Client-facing importance levels.

    importance: 1 (low) .. 5 (high)
    """

    importance: int

    @field_validator("importance")
    @classmethod
    def _valid_range(cls, v: int):
        if v < 1 or v > 5:
            raise ValueError("importance must be between 1 and 5")
        return v


@router.put("/subject/{subject_id}/importance")
def update_subject_importance(
    subject_id: str,
    user_id: str,
    payload: SubjectImportanceUpdate,
    session: Session = Depends(get_db),
):
    """Update a subject's importance level.

    For now we store it in the existing `difficulty` field (1..5).
    """

    try:
        subject_uuid = uuid.UUID(subject_id)
        user_uuid = uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid UUID format")

    subject = (
        session.query(Subject)
        .filter(Subject.id == subject_uuid, Subject.user_id == user_uuid)
        .first()
    )
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")

    subject.difficulty = payload.importance
    session.add(subject)
    session.commit()

    return {
        "message": "Importance updated successfully",
        "subject_id": str(subject.id),
        "importance": subject.difficulty,
    }
