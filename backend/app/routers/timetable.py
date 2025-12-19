from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from sqlalchemy.orm import Session, selectinload
from sqlalchemy import and_, or_
from app.db import get_db
from app.models.class_meeting import ClassMeeting
from app.models.subject import Subject
from app.models.user import User
from pydantic import BaseModel, field_validator
from datetime import time
from typing import List, Optional, Tuple
import uuid
import base64
import csv
import re
import io

router = APIRouter(prefix="/timetable", tags=["Timetable"])

TIME_HHMM_RE = re.compile(r"^(?:[01]\d|2[0-3]):[0-5]\d$")

# Pydantic Models


class ClassMeetingCreate(BaseModel):
    subject_id: str
    day_of_week: int  # 0-6 (0=Sun … 6=Sat)
    start_time: str  # "09:00"
    end_time: str
    rrule: Optional[str] = None

    @field_validator("day_of_week")
    @classmethod
    def validate_day_of_week(cls, v: int):
        if v < 0 or v > 6:
            raise ValueError("day_of_week must be between 0 and 6 (0=Sun … 6=Sat).")
        return v

    @field_validator("start_time", "end_time")
    @classmethod
    def validate_time_format(cls, v: str):
        # Enforce strict HH:MM (00:00–23:59). Rejects '1:00' and '24:00'.
        if not TIME_HHMM_RE.match(v):
            raise ValueError("Time must be in HH:MM format (00:00 to 23:59). Example: '09:00'.")
        return v


class ClassMeetingUpdate(BaseModel):
    day_of_week: Optional[int] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    rrule: Optional[str] = None
    subject_name: Optional[str] = None
    exam_date: Optional[str] = None
    exam_time: Optional[str] = None
    location: Optional[str] = None
    importance: Optional[int] = None
    notes: Optional[str] = None
    reminder_minutes: Optional[int] = None
    color: Optional[str] = None
    difficulty: Optional[int] = None
    target_grade: Optional[str] = None
    credit_weight: Optional[float] = None

    @field_validator("day_of_week")
    @classmethod
    def validate_day_of_week_optional(cls, v: Optional[int]):
        if v is None:
            return v
        if v < 0 or v > 6:
            raise ValueError("day_of_week must be between 0 and 6 (0=Sun … 6=Sat).")
        return v

    @field_validator("start_time", "end_time")
    @classmethod
    def validate_time_format_optional(cls, v: Optional[str]):
        if v is None:
            return v
        if not TIME_HHMM_RE.match(v):
            raise ValueError("Time must be in HH:MM format (00:00 to 23:59). Example: '09:00'.")
        return v


class SubjectCreate(BaseModel):
    user_id: str
    name: str
    exam_date: Optional[str] = None
    exam_time: Optional[str] = None
    location: Optional[str] = None
    importance: Optional[int] = None
    notes: Optional[str] = None
    reminder_minutes: Optional[int] = None
    color: Optional[str] = None
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
        return {"user_id": user_id, "timetable": []}

    timetable = {day: [] for day in range(7)}

    for subject in subjects:
        for meeting in subject.class_meetings:
            timetable[meeting.day_of_week].append(
                {
                    "meeting_id": str(meeting.id),
                    "subject_id": str(subject.id),
                    "subject_name": subject.name,
                    "day_of_week": meeting.day_of_week,
                    "start_time": meeting.start_time.strftime("%H:%M"),
                    "end_time": meeting.end_time.strftime("%H:%M"),
                    "rrule": meeting.rrule,
                }
            )

    # Sort meetings by start_time for each day
    for day in timetable:
        timetable[day].sort(key=lambda x: x["start_time"])

    return {"user_id": user_id, "timetable": timetable}


@router.get("/user/{user_id}/day/{day}")
def get_user_timetable_by_day(
    user_id: str, day: int, session: Session = Depends(get_db)
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
            ClassMeeting.day_of_week == day,
        )
        .order_by(ClassMeeting.start_time)
        .all()
    )

    if not meetings:
        return {"day": day, "meetings": []}

    result = [
        {
            "meeting_id": str(m.id),
            "subject_id": str(m.subject_id),
            "subject_name": m.subject.name if m.subject else None,
            "day_of_week": m.day_of_week,
            "start_time": m.start_time.strftime("%H:%M"),
            "end_time": m.end_time.strftime("%H:%M"),
            "rrule": m.rrule,
        }
        for m in meetings
    ]
    return {"day": day, "meetings": result}


@router.get("/admin/all-users")
def get_all_users_timetables(session: Session = Depends(get_db)):
    """
    Admin endpoint: all users and their subjects/meetings
    """
    users = (
        session.query(User)
        .options(selectinload(User.subjects).selectinload(Subject.class_meetings))
        .all()
    )

    all_data = []
    for u in users:
        user_entry = {"user_id": str(u.id), "email": u.email, "subjects": []}
        for s in u.subjects:
            subj_entry = {
                "subject_id": str(s.id),
                "name": s.name,
                "is_active": s.is_active,
                "class_meetings": [],
            }
            for m in s.class_meetings:
                subj_entry["class_meetings"].append(
                    {
                        "meeting_id": str(m.id),
                        "day_of_week": m.day_of_week,
                        "start_time": m.start_time.strftime("%H:%M"),
                        "end_time": m.end_time.strftime("%H:%M"),
                        "rrule": m.rrule,
                    }
                )
            user_entry["subjects"].append(subj_entry)
        all_data.append(user_entry)

    return {"users": all_data}


# CREATE ENDPOINTS


@router.post("/subject")
def create_subject(subject: SubjectCreate, session: Session = Depends(get_db)):
    """
    Yeni ders oluşturur.
    """
    try:
        uuid.UUID(subject.user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid user_id format")

    # ensure user exists
    user = session.query(User).filter(User.id == subject.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    new_subject = Subject(
        user_id=subject.user_id,
        name=subject.name,
        exam_date=subject.exam_date,
        exam_time=subject.exam_time,
        location=subject.location,
        importance=subject.importance,
        notes=subject.notes,
        reminder_minutes=subject.reminder_minutes,
        color=subject.color,
        difficulty=subject.difficulty,
        target_grade=subject.target_grade,
        credit_weight=subject.credit_weight,
        is_active=True,
    )

    session.add(new_subject)
    session.commit()
    session.refresh(new_subject)

    return {"subject_id": str(new_subject.id), "message": "Subject created successfully"}


@router.post("/meeting")
def create_class_meeting(meeting: ClassMeetingCreate, session: Session = Depends(get_db)):
    """
    Subject'a bağlı class meeting oluşturur.
    """
    # ensure subject exists
    subject = session.query(Subject).filter(Subject.id == meeting.subject_id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")

    start_time = time.fromisoformat(meeting.start_time)
    end_time = time.fromisoformat(meeting.end_time)

    new_meeting = ClassMeeting(
        subject_id=meeting.subject_id,
        day_of_week=meeting.day_of_week,
        start_time=start_time,
        end_time=end_time,
        rrule=meeting.rrule,
    )

    session.add(new_meeting)
    session.commit()
    session.refresh(new_meeting)

    return {"meeting_id": str(new_meeting.id), "message": "Meeting created successfully"}


# UPDATE ENDPOINTS


@router.put("/meeting/{meeting_id}")
def update_class_meeting(
    meeting_id: str, update_data: ClassMeetingUpdate, session: Session = Depends(get_db)
):
    """
    Class meeting update eder.
    """
    try:
        uuid.UUID(meeting_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid meeting_id format")

    meeting = session.query(ClassMeeting).filter(ClassMeeting.id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    # update meeting fields
    if update_data.day_of_week is not None:
        meeting.day_of_week = update_data.day_of_week
    if update_data.start_time is not None:
        meeting.start_time = time.fromisoformat(update_data.start_time)
    if update_data.end_time is not None:
        meeting.end_time = time.fromisoformat(update_data.end_time)
    if update_data.rrule is not None:
        meeting.rrule = update_data.rrule  # type: ignore[attr-defined]

    # update subject fields (optional convenience)
    if any(
        getattr(update_data, f) is not None
        for f in [
            "subject_name",
            "exam_date",
            "exam_time",
            "location",
            "importance",
            "notes",
            "reminder_minutes",
            "color",
            "difficulty",
            "target_grade",
            "credit_weight",
        ]
    ):
        subject = session.query(Subject).filter(Subject.id == meeting.subject_id).first()
        if subject:
            if update_data.subject_name is not None:
                subject.name = update_data.subject_name
            if update_data.exam_date is not None:
                subject.exam_date = update_data.exam_date
            if update_data.exam_time is not None:
                subject.exam_time = update_data.exam_time
            if update_data.location is not None:
                subject.location = update_data.location
            if update_data.importance is not None:
                subject.importance = update_data.importance
            if update_data.notes is not None:
                subject.notes = update_data.notes
            if update_data.reminder_minutes is not None:
                subject.reminder_minutes = update_data.reminder_minutes
            if update_data.color is not None:
                subject.color = update_data.color
            if update_data.difficulty is not None:
                subject.difficulty = update_data.difficulty
            if update_data.target_grade is not None:
                subject.target_grade = update_data.target_grade
            if update_data.credit_weight is not None:
                subject.credit_weight = update_data.credit_weight

    session.commit()
    return {"message": "Meeting updated successfully"}


# DELETE ENDPOINTS


@router.delete("/meeting/{meeting_id}")
def delete_class_meeting(meeting_id: str, session: Session = Depends(get_db)):
    try:
        uuid.UUID(meeting_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid meeting_id format")

    meeting = session.query(ClassMeeting).filter(ClassMeeting.id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    session.delete(meeting)
    session.commit()
    return {"message": "Meeting deleted successfully"}


@router.delete("/subject/{subject_id}")
def delete_subject(subject_id: str, session: Session = Depends(get_db)):
    try:
        uuid.UUID(subject_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid subject_id format")

    subject = session.query(Subject).filter(Subject.id == subject_id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")

    session.delete(subject)
    session.commit()
    return {"message": "Subject deleted successfully"}


# ===============================
# Image -> timetable extraction (OCR)
# ===============================

from PIL import Image

try:
    import pytesseract  # type: ignore
except Exception:  # pragma: no cover
    pytesseract = None


class TimetableExtractItem(BaseModel):
    day_of_week: Optional[int] = None  # 0-6 (Sun..Sat)
    day_label: Optional[str] = None
    start_time: Optional[str] = None  # HH:MM
    end_time: Optional[str] = None
    rrule: Optional[str] = None
    subject_title: Optional[str] = None
    subject_code: Optional[str] = None
    raw_line: Optional[str] = None


class TimetableExtractResponse(BaseModel):
    text: str
    items: List[TimetableExtractItem]


_DAY_MAP = {
    "sun": 0, "sunday": 0,
    "mon": 1, "monday": 1,
    "tue": 2, "tues": 2, "tuesday": 2,
    "wed": 3, "wednesday": 3,
    "thu": 4, "thur": 4, "thurs": 4, "thursday": 4,
    "fri": 5, "friday": 5,
    "sat": 6, "saturday": 6,
}

_TIME_RANGE_RE = re.compile(
    r"(?P<s>\b\d{1,2}[:\.]\d{2}\b)\s*[-–—]\s*(?P<e>\b\d{1,2}[:\.]\d{2}\b)",
    flags=re.IGNORECASE,
)


def _norm_time(t: str) -> str:
    t = t.strip().replace(".", ":")
    hh, mm = t.split(":", 1)
    return f"{int(hh):02d}:{int(mm):02d}"


def _infer_day(line: str) -> Tuple[Optional[int], Optional[str]]:
    lower = re.sub(r"[^a-z]", " ", line.lower())
    tokens = [t for t in lower.split() if t]
    for tok in tokens:
        if tok in _DAY_MAP:
            return _DAY_MAP[tok], tok
    return None, None


def _infer_subject(line: str, time_span: Optional[Tuple[str, str]]) -> Tuple[Optional[str], Optional[str]]:
    cleaned = line
    if time_span:
        s, e = time_span
        cleaned = cleaned.replace(s, " ").replace(e, " ")
    for k in _DAY_MAP.keys():
        cleaned = re.sub(rf"\b{k}\b", " ", cleaned, flags=re.IGNORECASE)

    cleaned = re.sub(r"\s+", " ", cleaned).strip(" -|\t")

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
    if pytesseract is None:
        raise HTTPException(
            status_code=500,
            detail="pytesseract is not installed on the server. Install Tesseract + pytesseract.",
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
    image_base64: str


@router.post("/extract-image-base64", response_model=TimetableExtractResponse)
def extract_timetable_from_image_base64(payload: TimetableExtractBase64In):
    if pytesseract is None:
        raise HTTPException(
            status_code=500,
            detail="pytesseract is not installed on the server. Install Tesseract + pytesseract.",
        )

    b64 = payload.image_base64.strip()
    if b64.lower().startswith("data:") and "," in b64:
        b64 = b64.split(",", 1)[1]

    try:
        raw = base64.b64decode(b64, validate=True)
    except Exception:
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
    if len(key) >= 3 and key[:3] in _DAY_MAP:
        return _DAY_MAP[key[:3]]
    return None


def _read_csv_text(raw: str) -> TimetableExtractResponse:
    f = io.StringIO(raw)
    reader = csv.DictReader(f)
    if not reader.fieldnames:
        raise HTTPException(status_code=400, detail="CSV has no headers/columns")

    def norm(h: str) -> str:
        return re.sub(r"[^a-z_]", "", h.strip().lower())

    headers = {norm(h): h for h in reader.fieldnames}

    def get(row, *names):
        for n in names:
            k = norm(n)
            if k in headers:
                return row.get(headers[k])
        return None

    items: List[TimetableExtractItem] = []
    for row in reader:
        day = _day_to_int(get(row, "day", "day_of_week"))
        start_raw = get(row, "start", "start_time")
        end_raw = get(row, "end", "end_time")
        if not start_raw or not end_raw:
            continue

        start = _norm_time(str(start_raw))
        end = _norm_time(str(end_raw))

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
    if not file.filename.lower().endswith(".csv"):
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
    return _read_csv_text(payload.csv)


# ===============================
# Course importance update
# ===============================

class SubjectImportanceUpdate(BaseModel):
    importance: int

    @field_validator("importance")
    @classmethod
    def _valid_range(cls, v: int) -> int:
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
