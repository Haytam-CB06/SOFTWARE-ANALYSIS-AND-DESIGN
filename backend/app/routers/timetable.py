from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from fastapi import Header
from sqlalchemy.orm import Session, selectinload
from sqlalchemy import and_, or_
from app.db import get_db
from app.models.class_meeting import ClassMeeting
from app.models.subject import Subject
from app.models.user import User
from app.models.user_week_study_schedule import UserWeekStudySchedule
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
    # Convenience fields to update the linked subject
    subject_name: Optional[str] = None  # alias for Subject.title
    code: Optional[str] = None
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
    """Create a subject for a user.

    NOTE: The original version of this router expected many extra fields
    (exam_date, location, importance, etc.). The actual SQLAlchemy Subject
    model only contains: title, code, difficulty, target_grade, credit_weight,
    and is_active.

    To remain backward compatible with earlier frontend code, we still accept
    `name` as an alias for `title`.
    """

    user_id: str
    # New canonical field
    title: Optional[str] = None
    # Backward-compatible alias
    name: Optional[str] = None
    code: Optional[str] = None
    difficulty: Optional[int] = None
    target_grade: Optional[str] = None
    credit_weight: Optional[float] = None

    @field_validator("title")
    @classmethod
    def _title_or_name_required(cls, v: Optional[str], info):
        # If title missing, try name; ensure at least one is present
        name = (info.data.get("name") or "").strip() if info.data else ""
        if (v is None or not str(v).strip()) and not name:
            raise ValueError("Either 'title' or 'name' is required")
        return v

    @field_validator("title")
    @classmethod
    def _title_non_empty(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        v = v.strip()
        if not v:
            raise ValueError("title must not be empty")
        return v

    def resolved_title(self) -> str:
        # prefer title; fall back to name
        t = (self.title or self.name or "").strip()
        if not t:
            raise ValueError("Either title or name must be provided")
        return t


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
                    "subject_name": getattr(subject, "title", None) or getattr(subject, "name", None),
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
            "subject_name": (getattr(m.subject, "title", None) or getattr(m.subject, "name", None)) if m.subject else None,
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
                "name": getattr(s, "title", None) or getattr(s, "name", None),
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


# ---------------------------------------------------------------------
# Frontend convenience: save/load calendar sessions for a user
# ---------------------------------------------------------------------


class CalendarSessionIn(BaseModel):
    """A lightweight session payload matching the frontend CalendarView."""

    id: Optional[str] = None
    subject: str
    startTime: str
    endTime: str
    day: int  # 0=Monday .. 6=Sunday (frontend convention)
    type: Optional[str] = None
    color: Optional[str] = None
    deadline: Optional[str] = None


class CalendarSessionOut(BaseModel):
    id: str
    subject: str
    startTime: str
    endTime: str
    day: int
    type: Optional[str] = None
    color: Optional[str] = None
    deadline: Optional[str] = None

    model_config = {"extra": "allow"}


def _guard_user_sessions(user_id: str, x_user_id: str, session: Session) -> None:
    """Guard helper for endpoints that should only be accessible by the logged-in user."""
    if not x_user_id or x_user_id != user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")
    u = session.query(User).filter(User.id == user_id).first()
    if not u:
        raise HTTPException(status_code=404, detail="User not found")


def _frontend_day_to_backend(day: int) -> int:
    # frontend: 0=Mon..6=Sun -> backend: 0=Sun..6=Sat
    return (day + 1) % 7


def _backend_day_to_frontend(day: int) -> int:
    # backend: 0=Sun..6=Sat -> frontend: 0=Mon..6=Sun
    return (day - 1) % 7


@router.get("/user/{user_id}/sessions", response_model=list[CalendarSessionOut])
def get_user_calendar_sessions(
    user_id: str,
    week_id: str = Query("default"),
    session: Session = Depends(get_db),
    x_user_id: str = Header(..., alias="X-User-Id"),
):
    """Return the user's *study* sessions for a given week (for CalendarView).

    This endpoint intentionally does NOT return the user's class schedule.
    Class schedules + busy time are stored separately and are used only by the
    auto-generation flow.
    """
    try:
        uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid user_id format")

    _guard_user_sessions(user_id, x_user_id, session)

    row = (
        session.query(UserWeekStudySchedule)
        .filter(UserWeekStudySchedule.user_id == user_id, UserWeekStudySchedule.week_id == week_id)
        .first()
    )
    stored = (row.sessions if row and isinstance(row.sessions, list) else [])

    out: list[CalendarSessionOut] = []
    for s in stored:
        if not isinstance(s, dict):
            continue
        try:
            out.append(
                CalendarSessionOut(
                    id=str(s.get("id") or uuid.uuid4()),
                    subject=str(s.get("subject") or ""),
                    startTime=str(s.get("startTime") or "08:00"),
                    endTime=str(s.get("endTime") or "09:00"),
                    day=int(s.get("day") if s.get("day") is not None else 0),
                    type=s.get("type"),
                    color=s.get("color"),
                    deadline=s.get("deadline"),
                )
            )
        except Exception:
            continue
    return out


@router.put("/user/{user_id}/sessions")
def put_user_calendar_sessions(
    user_id: str,
    payload: list[CalendarSessionIn],
    week_id: str = Query("default"),
    session: Session = Depends(get_db),
    x_user_id: str = Header(..., alias="X-User-Id"),
):
    """Replace the user's *study* sessions for a given week.

    This is used by the frontend to persist drag/drop edits so that study
    timetables survive logging in from another browser.
    """
    try:
        uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid user_id format")

    _guard_user_sessions(user_id, x_user_id, session)

    # Normalize into JSON-serializable dicts and ensure IDs exist.
    normalized = []
    for item in payload:
        sid = (item.id or "").strip() or str(uuid.uuid4())
        normalized.append(
            {
                "id": sid,
                "subject": (item.subject or "").strip(),
                "startTime": item.startTime,
                "endTime": item.endTime,
                "day": int(item.day),
                "type": item.type,
                "color": item.color,
                "deadline": item.deadline,
            }
        )

    row = (
        session.query(UserWeekStudySchedule)
        .filter(UserWeekStudySchedule.user_id == user_id, UserWeekStudySchedule.week_id == week_id)
        .first()
    )
    if not row:
        row = UserWeekStudySchedule(user_id=user_id, week_id=week_id, sessions=normalized)
        session.add(row)
    else:
        row.sessions = normalized
    session.commit()
    return {"ok": True, "week_id": week_id, "sessions": len(normalized)}


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
        title=subject.resolved_title(),
        code=subject.code,
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
            "code",
            "difficulty",
            "target_grade",
            "credit_weight",
        ]
    ):
        subject = session.query(Subject).filter(Subject.id == meeting.subject_id).first()
        if subject:
            if update_data.subject_name is not None:
                # keep backward compatible name but store in Subject.title
                subject.title = update_data.subject_name
            if update_data.code is not None:
                subject.code = update_data.code
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



# -------------------------------
# Tesseract resolution + parsing helpers
# -------------------------------
import os
import shutil

def _ensure_tesseract_cmd() -> None:
    """Ensure pytesseract knows where tesseract.exe is.

    In dev, FastAPI might be started from an environment that didn't inherit updated PATH
    (e.g., VS Code terminal opened before install). This makes OCR robust across shells.
    """
    if pytesseract is None:
        return

    # If already configured and exists, keep it.
    try:
        current = getattr(pytesseract.pytesseract, "tesseract_cmd", "") or ""
        if current and os.path.exists(current):
            return
    except Exception:
        pass

    # Try PATH first
    exe = None
    try:
        exe = shutil.which("tesseract")
    except Exception:
        exe = None
    candidates = []
    if exe:
        candidates.append(exe)

    # Common Windows install locations
    candidates.extend(
        [
            r"C:\\Program Files\\Tesseract-OCR\\tesseract.exe",
            r"C:\\Program Files (x86)\\Tesseract-OCR\\tesseract.exe",
        ]
    )

    for p in candidates:
        try:
            if p and os.path.exists(p):
                pytesseract.pytesseract.tesseract_cmd = p
                return
        except Exception:
            continue

    raise HTTPException(
        status_code=500,
        detail="Tesseract OCR is not installed or not on PATH. Install Tesseract (system package) and restart the backend.",
    )


def _extract_items_line_based(text: str) -> List[TimetableExtractItem]:
    """Old/simple parser: looks for day tokens + explicit time ranges like 08:00-08:50."""
    lines = [ln.strip() for ln in (text or "").splitlines() if ln.strip()]
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

        # Keep for debugging, but frontend will ignore incomplete rows.
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
    return items


_COURSE_CODE_RE = re.compile(r"^[A-Z]{2,10}\d{2,4}[A-Z]?$")


def _extract_items_grid(img: Image.Image) -> List[TimetableExtractItem]:
    """Heuristic grid parser for timetable screenshots (days across top, times down left, course codes in cells).

    Works better for images like a weekly schedule grid where times aren't written as explicit ranges.
    """
    if pytesseract is None:
        return []

    try:
        from pytesseract import Output  # type: ignore
        data = pytesseract.image_to_data(img, output_type=Output.DICT)
    except Exception:
        return []

    W, H = img.size
    n = len(data.get("text", []))
    words = []
    for i in range(n):
        t = (data.get("text", [""])[i] or "").strip()
        if not t:
            continue
        try:
            conf = float(str(data.get("conf", ["-1"])[i]))
        except Exception:
            conf = -1.0
        if conf < 30:
            continue
        try:
            left = int(data.get("left", [0])[i])
            top = int(data.get("top", [0])[i])
            w = int(data.get("width", [0])[i])
            h = int(data.get("height", [0])[i])
        except Exception:
            continue
        words.append(
            {
                "text": t,
                "left": left,
                "top": top,
                "width": w,
                "height": h,
                "x": left + (w / 2.0),
                "y": top + (h / 2.0),
                "block_num": data.get("block_num", [None])[i],
                "par_num": data.get("par_num", [None])[i],
                "line_num": data.get("line_num", [None])[i],
            }
        )

    if not words:
        return []

    header_y = H * 0.18
    left_x = W * 0.25
    # ---- Day columns (top header) ----
    day_hits = {}
    for w in words:
        if w["top"] > header_y:
            continue
        key = re.sub(r"[^a-z]", "", w["text"].lower())
        if len(key) >= 3 and key[:3] in _DAY_MAP:
            dk = key if key in _DAY_MAP else key[:3]
            di = _DAY_MAP[dk]
            day_hits.setdefault(di, []).append(w["x"])

    day_cols = []
    for di, xs in day_hits.items():
        day_cols.append((sum(xs) / max(len(xs), 1), di))
    day_cols.sort(key=lambda x: x[0])

    # Fallback: assume Mon..Fri evenly spaced (excluding left time label margin)
    if len(day_cols) < 2:
        margin = W * 0.15
        labels = [1, 2, 3, 4, 5]
        col_w = (W - margin) / len(labels)
        day_cols = [(margin + col_w * (i + 0.5), labels[i]) for i in range(len(labels))]

    xs = [x for x, _ in day_cols]
    bounds = [0.0]
    for i in range(len(xs) - 1):
        bounds.append((xs[i] + xs[i + 1]) / 2.0)
    bounds.append(float(W))

    def day_for_x(x: float) -> Optional[int]:
        for i in range(len(xs)):
            if bounds[i] <= x < bounds[i + 1]:
                return day_cols[i][1]
        return None

    # ---- Time rows (left column) ----
    left_words = [w for w in words if w["left"] < left_x and w["top"] > header_y]
    line_groups = {}
    for w in left_words:
        k = (w.get("block_num"), w.get("par_num"), w.get("line_num"))
        line_groups.setdefault(k, []).append(w)

    time_rows = []
    for _, ws in line_groups.items():
        ws = sorted(ws, key=lambda z: z["left"])
        line_text = " ".join([z["text"] for z in ws])
        m = re.search(r"\b(\d{1,2})\s*(AM|PM)?\b", line_text, flags=re.I)
        if not m:
            continue
        hour = int(m.group(1))
        ampm = (m.group(2) or "").upper()
        y = sum([z["y"] for z in ws]) / max(len(ws), 1)
        time_rows.append((y, hour, ampm))

    time_rows.sort(key=lambda t: t[0])
    if not time_rows:
        return []

    start_times = []
    prev_hour = None
    is_pm = False
    for y, hour, ampm in time_rows:
        if ampm == "PM":
            is_pm = True
        elif ampm == "AM":
            is_pm = False
        else:
            # Heuristic: when hours wrap down (12 -> 1), we crossed into PM region
            if prev_hour is not None and hour < prev_hour:
                is_pm = True
        prev_hour = hour

        # Convert to 24h
        if ampm == "AM":
            hh = 0 if hour == 12 else hour
        elif ampm == "PM":
            hh = 12 if hour == 12 else hour + 12
        else:
            hh = 12 if (is_pm and hour == 12) else (hour + 12 if is_pm and hour != 12 else (0 if hour == 12 else hour))

        start_times.append((y, hh))

    diffs = [start_times[i + 1][0] - start_times[i][0] for i in range(len(start_times) - 1)]
    diffs = [d for d in diffs if d > 0]
    diffs.sort()
    row_h = diffs[len(diffs) // 2] if diffs else (H * 0.08)

    def nearest_start(y: float) -> Optional[int]:
        if not start_times:
            return None
        yy, hh = min(start_times, key=lambda t: abs(t[0] - y))
        # ignore far-away matches
        if abs(yy - y) > row_h * 0.9:
            return None
        return hh

    # ---- Course codes in grid cells ----
    items: List[TimetableExtractItem] = []
    for w in words:
        if w["top"] <= header_y or w["left"] <= W * 0.12:
            continue
        raw = re.sub(r"[^A-Za-z0-9]", "", w["text"]).upper()
        if not raw or not _COURSE_CODE_RE.match(raw):
            continue
        day_idx = day_for_x(w["x"])
        if day_idx is None:
            continue
        hh = nearest_start(w["y"])
        if hh is None:
            continue

        start_time = f"{hh:02d}:00"
        slots = 1
        try:
            slots = max(1, int(round(w["height"] / max(row_h, 1))))
        except Exception:
            slots = 1

        end_total = (hh * 60) + (slots * 50)  # classes are typically 50 mins in your UI
        end_h = end_total // 60
        end_m = end_total % 60
        end_time = f"{end_h:02d}:{end_m:02d}"

        items.append(
            TimetableExtractItem(
                day_of_week=day_idx,
                start_time=start_time,
                end_time=end_time,
                subject_title=raw,
                subject_code=raw,
                raw_line=w["text"],
            )
        )

    # Deduplicate
    seen = set()
    uniq: List[TimetableExtractItem] = []
    for it in items:
        key = (it.day_of_week, it.start_time, it.end_time, it.subject_code or it.subject_title)
        if key in seen:
            continue
        seen.add(key)
        uniq.append(it)

    return uniq
@router.post("/extract-image", response_model=TimetableExtractResponse)
async def extract_timetable_from_image(file: UploadFile = File(...)):
    if pytesseract is None:
        raise HTTPException(
            status_code=500,
            detail="pytesseract is not installed on the server. Install Tesseract + pytesseract.",
        )

    _ensure_tesseract_cmd()

    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Please upload an image file.")

    data = await file.read()
    try:
        img = Image.open(io.BytesIO(data)).convert("RGB")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid image: {e}")

    # OCR text (use a reasonable PSM for schedules)
    try:
        text = pytesseract.image_to_string(img, config="--psm 6")
    except Exception:
        text = pytesseract.image_to_string(img)

    # 1) Try the simple line-based parser (works for "Mon 08:00-08:50 Calculus" style)
    items = _extract_items_line_based(text)

    def is_complete(it: TimetableExtractItem) -> bool:
        return (
            it.day_of_week is not None
            and bool(it.start_time)
            and bool(it.end_time)
            and bool(it.subject_title)
        )

    # 2) If it doesn't produce usable rows, try the grid parser (works for timetable screenshots)
    if not any(is_complete(it) for it in items):
        grid_items = _extract_items_grid(img)
        if grid_items:
            items = grid_items

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

    _ensure_tesseract_cmd()

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

    try:
        text = pytesseract.image_to_string(img, config="--psm 6")
    except Exception:
        text = pytesseract.image_to_string(img)

    items = _extract_items_line_based(text)

    def is_complete(it: TimetableExtractItem) -> bool:
        return (
            it.day_of_week is not None
            and bool(it.start_time)
            and bool(it.end_time)
            and bool(it.subject_title)
        )

    if not any(is_complete(it) for it in items):
        grid_items = _extract_items_grid(img)
        if grid_items:
            items = grid_items

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
