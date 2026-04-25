from __future__ import annotations

import re
import uuid
import random
import secrets
from datetime import datetime, timedelta, timezone
from datetime import time
from typing import List, Literal, Optional, Tuple

from fastapi import APIRouter, Depends, HTTPException, Header
from pydantic import BaseModel, field_validator, Field, AliasChoices
from sqlalchemy.orm import Session, selectinload

from app.db import get_db
from app.models.class_meeting import ClassMeeting
from app.models.assessment import Assessment
from app.models.subject import Subject
from app.models.user import User
from app.models.study_window_setting import StudyWindowSetting
from app.models.user_busy_block import UserBusyBlock


router = APIRouter(prefix="/auto-generate", tags=["Auto Generate"])


TIME_HHMM_RE = re.compile(r"^(?:[01]\d|2[0-3]):[0-5]\d$")


def _parse_hhmm(v: str) -> time:
    if not TIME_HHMM_RE.match(v):
        raise ValueError("Time must be in HH:MM format (00:00 to 23:59).")
    return time.fromisoformat(v)


def _to_minutes(t: time) -> int:
    return t.hour * 60 + t.minute


def _minutes_to_hhmm(m: int) -> str:
    h = m // 60
    mm = m % 60
    return f"{h:02d}:{mm:02d}"


def _merge_intervals(intervals: List[Tuple[int, int]]) -> List[Tuple[int, int]]:
    if not intervals:
        return []
    intervals = sorted(intervals)
    merged: List[Tuple[int, int]] = [intervals[0]]
    for s, e in intervals[1:]:
        ps, pe = merged[-1]
        if s <= pe:
            merged[-1] = (ps, max(pe, e))
        else:
            merged.append((s, e))
    return merged


def _subtract_intervals(base: List[Tuple[int, int]], blocks: List[Tuple[int, int]]) -> List[Tuple[int, int]]:
    """Subtract block intervals from base intervals."""
    if not base:
        return []
    if not blocks:
        return base
    blocks = _merge_intervals(blocks)
    result: List[Tuple[int, int]] = []
    for bs, be in base:
        cur_s, cur_e = bs, be
        for xs, xe in blocks:
            if xe <= cur_s:
                continue
            if xs >= cur_e:
                break
            if xs > cur_s:
                result.append((cur_s, xs))
            cur_s = max(cur_s, xe)
            if cur_s >= cur_e:
                break
        if cur_s < cur_e:
            result.append((cur_s, cur_e))
    return result


def _frontend_day_to_backend(day: int) -> int:
    # frontend: 0=Mon..6=Sun -> backend: 0=Sun..6=Sat
    return (day + 1) % 7


def _backend_day_to_frontend(day: int) -> int:
    # backend: 0=Sun..6=Sat -> frontend: 0=Mon..6=Sun
    return (day - 1) % 7


def _add_interval_with_wrap(busy_by_day: List[List[Tuple[int, int]]], day_frontend: int, start_min: int, end_min: int) -> None:
    """Add an interval that may cross midnight.

    If end_min <= start_min, treat it as crossing midnight:
      day: start..24:00
      next day: 00:00..end
    """
    if end_min > start_min:
        busy_by_day[day_frontend].append((start_min, end_min))
        return

    # crosses midnight
    busy_by_day[day_frontend].append((start_min, 24 * 60))
    next_day = (day_frontend + 1) % 7
    busy_by_day[next_day].append((0, end_min))


def _difficulty_to_priority_label(difficulty: Optional[int]) -> Literal["low", "medium", "high"]:
    if difficulty is None:
        return "medium"
    if difficulty >= 4:
        return "high"
    if difficulty >= 2:
        return "medium"
    return "low"


def _priority_label_to_difficulty(p: Literal["low", "medium", "high"]) -> int:
    # store as 1/3/5 for compatibility with existing Subject.difficulty
    return {"low": 1, "medium": 3, "high": 5}[p]


class StudyWindowIn(BaseModel):
    weekdayStart: str
    weekdayEnd: str
    includeWeekends: bool = False
    weekendSameAsWeekday: bool = True
    weekendStart: Optional[str] = None
    weekendEnd: Optional[str] = None

    @field_validator("weekdayStart", "weekdayEnd", "weekendStart", "weekendEnd")
    @classmethod
    def _times_ok(cls, v: Optional[str]):
        if v is None:
            return v
        _parse_hhmm(v)
        return v


class BusyBlockIn(BaseModel):
    title: Optional[str] = None
    day: int  # 0=Mon .. 6=Sun (frontend convention)
    startTime: str
    endTime: str

    @field_validator("day")
    @classmethod
    def _day_ok(cls, v: int):
        if v < 0 or v > 6:
            raise ValueError("day must be 0..6 (0=Mon .. 6=Sun)")
        return v

    @field_validator("startTime", "endTime")
    @classmethod
    def _time_ok(cls, v: str):
        _parse_hhmm(v)
        return v


class AutoGenerateRequest(BaseModel):
    user_id: str
    window: StudyWindowIn
    busy_blocks: List[BusyBlockIn] = []
    treat_class_schedule_as_busy: bool = True

    # If false, the generator will NOT load the user's stored busy blocks
    # from the database, and will only use the busy_blocks supplied in this
    # request (plus existing week sessions if enabled).
    #
    # This is used by workspace auto-generate so the shared (workspace) inputs
    # can be kept separate from each user's personal settings.
    use_stored_busy_blocks: bool = True

    # RNG seed (optional) used for weighted-random course selection.
    # - If provided, the same settings + seed will reproduce the same timetable.
    # - If omitted, the server will generate a new seed each request.
    seed: Optional[int] = None

    # If true, ignore any provided seed and generate a new one.
    # This supports the frontend "Shuffle" action.
    shuffle: bool = False

    # Minutes of break time between *consecutive generated study sessions*.
    # Treated as unavailable time during scheduling.
    # Accept both camelCase (breakMinutes) and snake_case (break_minutes) from the frontend
    # to avoid silent fallback to defaults.
    breakMinutes: int = Field(10, validation_alias=AliasChoices('breakMinutes', 'break_minutes'))

    @field_validator("breakMinutes")
    @classmethod
    def _break_ok(cls, v: int):
        try:
            v = int(v)
        except Exception:
            raise ValueError("breakMinutes must be an integer")
        if v < 0 or v > 180:
            raise ValueError("breakMinutes must be between 0 and 180")
        return v

    @field_validator("seed")
    @classmethod
    def _seed_ok(cls, v: Optional[int]):
        if v is None:
            return v
        try:
            v = int(v)
        except Exception:
            raise ValueError("seed must be an integer")
        # Keep seed in a sane range to avoid odd platform-specific behaviors
        if v < 0 or v > 2**31 - 1:
            raise ValueError("seed must be between 0 and 2147483647")
        return v


class GeneratedSession(BaseModel):
    id: str
    subject: str
    startTime: str
    endTime: str
    day: int  # 0=Mon..6=Sun
    type: Literal["reading", "revision", "practice"] = "practice"
    color: str
    priority: Literal["low", "medium", "high"]


class CourseRowIn(BaseModel):
    title: str
    days: List[int]  # 0=Mon..6=Sun (frontend)
    startTime: str
    endTime: str
    priority: Literal["low", "medium", "high"] = "medium"

    @field_validator("title")
    @classmethod
    def _title_ok(cls, v: str):
        v = (v or "").strip()
        if not v:
            raise ValueError("title is required")
        return v

    @field_validator("days")
    @classmethod
    def _days_ok(cls, v: List[int]):
        if not v:
            raise ValueError("Select at least one day")
        for d in v:
            if d < 0 or d > 6:
                raise ValueError("days must be 0..6 (0=Mon..6=Sun)")
        # remove duplicates and keep sorted
        return sorted(set(v))

    @field_validator("startTime", "endTime")
    @classmethod
    def _time_ok(cls, v: str):
        _parse_hhmm(v)
        return v


class ClassScheduleUpdateRequest(BaseModel):
    user_id: str
    courses: List[CourseRowIn]


class BusyBlocksUpdateRequest(BaseModel):
    user_id: str
    busy_blocks: List[BusyBlockIn]


class StudyWindowUpdateRequest(BaseModel):
    user_id: str
    window: StudyWindowIn


def _guard_user(payload_user_id: str, x_user_id: str, session: Session) -> User:
    if payload_user_id != x_user_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    try:
        uuid.UUID(payload_user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid user_id format")

    user = session.query(User).filter(User.id == payload_user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.get("/study-window", response_model=dict)
def get_study_window(
    user_id: str,
    session: Session = Depends(get_db),
    x_user_id: str = Header(..., alias="X-User-Id"),
):
    _guard_user(user_id, x_user_id, session)

    setting = session.query(StudyWindowSetting).filter(StudyWindowSetting.user_id == user_id).first()
    if not setting:
        return {
            "window": {
                "weekdayStart": "08:00",
                "weekdayEnd": "19:00",
                "includeWeekends": False,
                "weekendSameAsWeekday": True,
                "weekendStart": None,
                "weekendEnd": None,
            }
        }

    return {
        "window": {
            "weekdayStart": setting.weekday_start.strftime("%H:%M"),
            "weekdayEnd": setting.weekday_end.strftime("%H:%M"),
            "includeWeekends": bool(setting.include_weekends),
            "weekendSameAsWeekday": bool(setting.weekend_same_as_weekday),
            "weekendStart": setting.weekend_start.strftime("%H:%M") if setting.weekend_start else None,
            "weekendEnd": setting.weekend_end.strftime("%H:%M") if setting.weekend_end else None,
        }
    }


@router.put("/study-window", response_model=dict)
def put_study_window(
    payload: StudyWindowUpdateRequest,
    session: Session = Depends(get_db),
    x_user_id: str = Header(..., alias="X-User-Id"),
):
    _guard_user(payload.user_id, x_user_id, session)

    wd_start = _parse_hhmm(payload.window.weekdayStart)
    wd_end = _parse_hhmm(payload.window.weekdayEnd)
    if _to_minutes(wd_end) <= _to_minutes(wd_start):
        raise HTTPException(status_code=400, detail="weekdayEnd must be after weekdayStart")

    we_start = we_end = None
    if not payload.window.weekendSameAsWeekday and payload.window.weekendStart and payload.window.weekendEnd:
        we_start = _parse_hhmm(payload.window.weekendStart)
        we_end = _parse_hhmm(payload.window.weekendEnd)
        if _to_minutes(we_end) <= _to_minutes(we_start):
            raise HTTPException(status_code=400, detail="weekendEnd must be after weekendStart")

    setting = session.query(StudyWindowSetting).filter(StudyWindowSetting.user_id == payload.user_id).first()
    if not setting:
        setting = StudyWindowSetting(user_id=payload.user_id)
        session.add(setting)

    setting.weekday_start = wd_start
    setting.weekday_end = wd_end
    setting.include_weekends = bool(payload.window.includeWeekends)
    setting.weekend_same_as_weekday = bool(payload.window.weekendSameAsWeekday)
    setting.weekend_start = we_start
    setting.weekend_end = we_end

    session.commit()
    return {"ok": True}


@router.get("/busy-blocks", response_model=dict)
def get_busy_blocks(
    user_id: str,
    session: Session = Depends(get_db),
    x_user_id: str = Header(..., alias="X-User-Id"),
):
    _guard_user(user_id, x_user_id, session)

    blocks = (
        session.query(UserBusyBlock)
        .filter(UserBusyBlock.user_id == user_id)
        .order_by(UserBusyBlock.day_of_week, UserBusyBlock.start_time)
        .all()
    )

    out = []
    for b in blocks:
        out.append(
            {
                "id": str(b.id),
                "title": b.title,
                "day": _backend_day_to_frontend(int(b.day_of_week)),
                "startTime": b.start_time.strftime("%H:%M"),
                "endTime": b.end_time.strftime("%H:%M"),
            }
        )
    return {"busy_blocks": out}


@router.put("/busy-blocks", response_model=dict)
def put_busy_blocks(
    payload: BusyBlocksUpdateRequest,
    session: Session = Depends(get_db),
    x_user_id: str = Header(..., alias="X-User-Id"),
):
    _guard_user(payload.user_id, x_user_id, session)

    # Clear existing
    session.query(UserBusyBlock).filter(UserBusyBlock.user_id == payload.user_id).delete()
    session.flush()

    created = 0
    for b in payload.busy_blocks:
        st = _parse_hhmm(b.startTime)
        en = _parse_hhmm(b.endTime)

        nb = UserBusyBlock(
            user_id=payload.user_id,
            title=(b.title or "Busy").strip() or "Busy",
            day_of_week=_frontend_day_to_backend(b.day),
            start_time=st,
            end_time=en,
        )
        session.add(nb)
        created += 1

    session.commit()
    return {"ok": True, "count": created}


@router.get("/class-schedule", response_model=dict)
def get_class_schedule(
    user_id: str,
    session: Session = Depends(get_db),
    x_user_id: str = Header(..., alias="X-User-Id"),
):
    _guard_user(user_id, x_user_id, session)

    subjects = (
        session.query(Subject)
        .options(selectinload(Subject.class_meetings))
        .filter(Subject.user_id == user_id, Subject.is_active == True)  # noqa: E712
        .all()
    )

    # Group meetings that share the same subject + time into a single row with multiple days
    groups: dict[Tuple[str, str, str], dict] = {}
    for s in subjects:
        title = (getattr(s, "title", None) or getattr(s, "name", None) or "").strip() or "(Untitled)"
        priority = _difficulty_to_priority_label(getattr(s, "difficulty", None))
        for m in s.class_meetings:
            key = (
                title,
                m.start_time.strftime("%H:%M"),
                m.end_time.strftime("%H:%M"),
            )
            if key not in groups:
                groups[key] = {
                    "id": str(uuid.uuid4()),
                    "title": title,
                    "priority": priority,
                    "startTime": key[1],
                    "endTime": key[2],
                    "days": [],
                }
            groups[key]["days"].append(_backend_day_to_frontend(int(m.day_of_week)))

    out = list(groups.values())
    for row in out:
        row["days"] = sorted(set(row["days"]))

    # Sort: Mon..Sun, then time
    out.sort(key=lambda r: (min(r["days"]) if r["days"] else 99, r["startTime"], r["title"]))
    return {"courses": out}


@router.put("/class-schedule", response_model=dict)
def put_class_schedule(
    payload: ClassScheduleUpdateRequest,
    session: Session = Depends(get_db),
    x_user_id: str = Header(..., alias="X-User-Id"),
):
    _guard_user(payload.user_id, x_user_id, session)

    # Upsert the user's class schedule.
    # We *do not* delete subjects because they may be referenced by other tables
    # (e.g., assessments/deadlines). Instead:
    #  - mark all existing subjects inactive
    #  - clear existing class meetings
    #  - upsert subjects from the payload and mark them active

    existing_subjects = (
        session.query(Subject)
        .filter(Subject.user_id == payload.user_id)
        .all()
    )

    existing_by_title: dict[str, Subject] = {}
    subject_ids = []
    for s in existing_subjects:
        title = (getattr(s, "title", None) or getattr(s, "name", None) or "").strip()
        if title:
            existing_by_title[title] = s
        s.is_active = False
        subject_ids.append(s.id)

    # Clear meetings for all subjects in one go
    if subject_ids:
        session.query(ClassMeeting).filter(ClassMeeting.subject_id.in_(subject_ids)).delete(synchronize_session=False)
        session.flush()

    subject_map: dict[str, Subject] = dict(existing_by_title)
    created_meetings = 0
    touched_titles: set[str] = set()

    for row in payload.courses:
        title = (row.title or "").strip()
        if not title:
            continue

        touched_titles.add(title)

        if title not in subject_map:
            subj = Subject(
                user_id=payload.user_id,
                title=title,
                difficulty=_priority_label_to_difficulty(row.priority),
                is_active=True,
            )
            session.add(subj)
            session.flush()
            subject_map[title] = subj
        else:
            subj = subject_map[title]
            subj.is_active = True
            subj.difficulty = _priority_label_to_difficulty(row.priority)

        st = _parse_hhmm(row.startTime)
        en = _parse_hhmm(row.endTime)

        for d in row.days:
            m = ClassMeeting(
                subject_id=subject_map[title].id,
                day_of_week=_frontend_day_to_backend(d),
                start_time=st,
                end_time=en,
                rrule=None,
            )
            session.add(m)
            created_meetings += 1

    session.commit()
    return {"ok": True, "subjects": len(touched_titles), "meetings": created_meetings}


@router.post("", response_model=dict)
def auto_generate(
    payload: AutoGenerateRequest,
    session: Session = Depends(get_db),
    x_user_id: str = Header(..., alias="X-User-Id"),
):
    _guard_user(payload.user_id, x_user_id, session)

    # Pull user's courses (subjects)
    subjects = (
        session.query(Subject)
        .options(selectinload(Subject.class_meetings))
        .filter(Subject.user_id == payload.user_id, Subject.is_active == True)  # noqa: E712
        .all()
    )
    if not subjects:
        raise HTTPException(status_code=400, detail="No class schedule found. Fill or upload your class timetable first.")

    courses = []
    for s in subjects:
        title = (getattr(s, "title", None) or getattr(s, "name", None) or "").strip()
        if not title:
            continue
        pr = _difficulty_to_priority_label(getattr(s, "difficulty", None))
        base_weight = {"high": 3, "medium": 2, "low": 1}[pr]
        courses.append({"id": str(s.id), "title": title, "priority": pr, "base_weight": base_weight})

    # Stable ordering so the same seed + same inputs reproduce the same schedule.
    courses.sort(key=lambda c: (c["priority"], c["title"]))

    if not courses:
        raise HTTPException(status_code=400, detail="No valid courses found")
    MAX_TOTAL_MINUTES = 600
    MAX_SESSIONS = 10
    PER_SUBJECT_MAX_MINUTES = {
        "high": 180,
        "medium": 120,
        "low": 90,
    }

    sessions_created = 0
    total_minutes_used = 0
    subject_minutes: dict[str, int] = {}
    subject_day_seen: set[tuple[str, int]] = set()
  
    COURSE_COLOR_PALETTE = [
        "#3B82F6",  # blue
        "#A855F7",  # purple
        "#10B981",  # emerald
        "#6366F1",  # indigo
        "#F97316",  # orange
        "#EC4899",  # pink
        "#14B8A6",  # teal
        "#0EA5E9",  # sky
        "#8B5CF6",  # violet
        "#06B6D4",  # cyan
    ]

    def _course_color(title: str) -> str:
        t = (title or "").strip().lower()
        if not t:
            return "#3B82F6"
        h = 0
        for ch in t:
            h = (h * 31 + ord(ch)) & 0xFFFFFFFF
        return COURSE_COLOR_PALETTE[h % len(COURSE_COLOR_PALETTE)]

    base_chunk_minutes = {"low": 30, "medium": 40, "high": 50}

    # Study windows
    wd_start = _to_minutes(_parse_hhmm(payload.window.weekdayStart))
    wd_end = _to_minutes(_parse_hhmm(payload.window.weekdayEnd))
    if wd_end <= wd_start:
        raise HTTPException(status_code=400, detail="weekdayEnd must be after weekdayStart")

    if payload.window.weekendSameAsWeekday or not (payload.window.weekendStart and payload.window.weekendEnd):
        we_start, we_end = wd_start, wd_end
    else:
        we_start = _to_minutes(_parse_hhmm(payload.window.weekendStart))
        we_end = _to_minutes(_parse_hhmm(payload.window.weekendEnd))
        if we_end <= we_start:
            raise HTTPException(status_code=400, detail="weekendEnd must be after weekendStart")

    include_weekends = bool(payload.window.includeWeekends)

    # Break gap (in minutes) used for spacing.
    # - Between consecutive generated study sessions (handled during scheduling)
    # - Before an upcoming busy block (handled by reserving a buffer at the end of free intervals)
    break_mins: int = int(payload.breakMinutes or 0)

    # Busy intervals from class schedule + busy blocks
    busy_by_day: List[List[Tuple[int, int]]] = [[] for _ in range(7)]  # frontend day index

    if payload.treat_class_schedule_as_busy:
        for s in subjects:
            for m in s.class_meetings:
                d = _backend_day_to_frontend(int(m.day_of_week))
                start_min = _to_minutes(m.start_time)
                end_min = _to_minutes(m.end_time)
                _add_interval_with_wrap(busy_by_day, d, start_min, end_min)

    # Stored busy blocks (optional)
    if payload.use_stored_busy_blocks:
        stored_busy = (
            session.query(UserBusyBlock)
            .filter(UserBusyBlock.user_id == payload.user_id)
            .order_by(UserBusyBlock.day_of_week, UserBusyBlock.start_time)
            .all()
        )
        for b in stored_busy:
            d = _backend_day_to_frontend(int(b.day_of_week))
            _add_interval_with_wrap(busy_by_day, d, _to_minutes(b.start_time), _to_minutes(b.end_time))

    # Extra busy blocks from request
    for b in payload.busy_blocks:
        smin = _to_minutes(_parse_hhmm(b.startTime))
        emin = _to_minutes(_parse_hhmm(b.endTime))
        _add_interval_with_wrap(busy_by_day, b.day, smin, emin)

    # Free intervals per day
    free_by_day: List[List[Tuple[int, int]]] = [[] for _ in range(7)]
    for d in range(7):
        is_weekend = d in (5, 6)  # Sat(5), Sun(6) in frontend convention
        if is_weekend and not include_weekends:
            continue

        day_start, day_end = (we_start, we_end) if is_weekend else (wd_start, wd_end)
        base = [(day_start, day_end)]
        blocks = _merge_intervals(busy_by_day[d])

        free = _subtract_intervals(base, blocks)

        # Human-spacing rule: if a free interval ends right when a busy block starts,
        # reserve a break buffer so we don't schedule a study session that runs straight
        # into a "busy" time. (If the buffer doesn't fit, we drop that tail.)
        if break_mins > 0 and blocks:
            busy_starts = {int(bs) for bs, _ in blocks}
            spaced: List[Tuple[int, int]] = []
            for s, e in free:
                if int(e) in busy_starts:
                    e2 = int(e) - break_mins
                    if e2 > int(s):
                        spaced.append((int(s), int(e2)))
                else:
                    spaced.append((int(s), int(e)))
            free_by_day[d] = spaced
        else:
            free_by_day[d] = free

    # =====================
    # CP-08: deadline/exam awareness v1
    # - Use upcoming assessments (next 7 days) to boost a course's effective weight.
    # - Convert weights -> target minutes per course/week.
    # =====================

    # Total available minutes across the week (study window minus busy blocks).
    total_available_minutes_week = 0
    free_minutes_by_day: List[int] = [0 for _ in range(7)]
    for d in range(7):
        if d in (5, 6) and not include_weekends:
            continue
        for s, e in free_by_day[d]:
            mins = int(e) - int(s)
            total_available_minutes_week += mins
            free_minutes_by_day[d] += mins

    # IMPORTANT: do not try to fill the user's entire free week.
    # The old logic allocated the whole free-time budget across courses, which
    # created far too many generated study sessions. Instead, cap the total
    # study budget to a realistic weekly amount based on the number of courses,
    # while still respecting available time.
    base_target_by_priority = {"low": 45, "medium": 75, "high": 105}
    desired_study_minutes_week = 0
    for c in courses:
        desired_study_minutes_week += int(base_target_by_priority.get(c["priority"], 75))

    # Keep the generator conservative. Even with many courses, avoid flooding
    # the calendar; deadlines can still boost individual course weights later.
    desired_study_minutes_week = min(desired_study_minutes_week, 12 * 60)

    # Never exceed the actual free time, and never be less than one minimum
    # session per course if the user has enough free time.
    if total_available_minutes_week >= 20 * len(courses):
        desired_study_minutes_week = max(desired_study_minutes_week, 20 * len(courses))
    desired_study_minutes_week = min(desired_study_minutes_week, total_available_minutes_week)

    now_utc = datetime.now(timezone.utc)
    week_end_utc = now_utc + timedelta(days=7)

    subject_ids = [uuid.UUID(c["id"]) for c in courses]
    upcoming_assessments = (
        session.query(Assessment)
        .filter(
            Assessment.subject_id.in_(subject_ids),
            Assessment.is_completed == False,  # noqa: E712
            Assessment.due_at >= now_utc,
            Assessment.due_at < week_end_utc,
        )
        .all()
    )

    # Build urgency score per subject/course title.
    title_by_subject_id = {c["id"]: c["title"] for c in courses}
    urgency_by_title: dict[str, float] = {c["title"]: 0.0 for c in courses}
    assessments_meta: List[dict] = []

    def _kind_boost(kind: str) -> float:
        k = (kind or "").strip().lower()
        if any(x in k for x in ["exam", "midterm", "final", "test"]):
            return 2.2
        # other deadlines still matter
        return 1.4

    def _time_decay(days_until: float) -> float:
        # Nearer deadlines => larger boost; bounded to avoid exploding weights.
        # Example: at 0 days: ~4.0, at 6 days: ~1.43
        return min(4.0, 1.0 + (3.0 / (days_until + 1.0)))

    for a in upcoming_assessments:
        sid = str(a.subject_id)
        title = title_by_subject_id.get(sid)
        if not title:
            continue
        due = a.due_at
        # due_at is timezone aware per model; fall back defensively.
        if due.tzinfo is None:
            due = due.replace(tzinfo=timezone.utc)
        days_until = max(0.0, (due - now_utc).total_seconds() / 86400.0)
        kb = _kind_boost(getattr(a, "kind", ""))
        td = _time_decay(days_until)
        # Optional size factor from estimate_hours.
        size = 1.0
        try:
            if getattr(a, "estimate_hours", None) is not None:
                size = 1.0 + min(float(a.estimate_hours), 10.0) / 5.0
        except Exception:
            size = 1.0
        bump = kb * td * size
        urgency_by_title[title] = float(urgency_by_title.get(title, 0.0)) + float(bump)
        assessments_meta.append(
            {
                "subject": title,
                "kind": getattr(a, "kind", None),
                "title": getattr(a, "title", None),
                "due_at": due.isoformat(),
                "days_until": round(days_until, 2),
                "boost": round(bump, 3),
            }
        )

    # Effective weights combine base priority + urgency (additive across multiple assessments).
    effective_weight_by_title: dict[str, float] = {}
    for c in courses:
        title = c["title"]
        base_w = float(c["base_weight"])
        urg = float(urgency_by_title.get(title, 0.0))
        effective_weight_by_title[title] = max(0.1, base_w * (1.0 + urg))

    total_effective_weight = sum(effective_weight_by_title.values())
    if total_effective_weight <= 0:
        total_effective_weight = float(len(courses))
        for c in courses:
            effective_weight_by_title[c["title"]] = 1.0

    # Convert weights -> target minutes per course/week, but use the capped
    # study budget instead of the full free-time budget.
    min_floor = 0
    if desired_study_minutes_week >= 20 * len(courses):
        min_floor = 20

    target_minutes_by_title: dict[str, int] = {}
    # First pass: proportional allocation
    for c in courses:
        title = c["title"]
        share = effective_weight_by_title[title] / total_effective_weight
        target = int(round(share * desired_study_minutes_week))

        # Hard upper bounds keep a single course from taking over the whole week.
        pr = c["priority"]
        per_course_cap = {"low": 90, "medium": 150, "high": 210}[pr]
        target = min(target, per_course_cap)

        if min_floor:
            target = max(target, min_floor)
        target_minutes_by_title[title] = max(0, target)

    # Second pass: normalize to match the capped weekly budget.
    allocated = sum(target_minutes_by_title.values())
    if allocated > 0 and desired_study_minutes_week > 0 and allocated > desired_study_minutes_week:
        scale = desired_study_minutes_week / float(allocated)
        for k in list(target_minutes_by_title.keys()):
            target_minutes_by_title[k] = int(round(target_minutes_by_title[k] * scale))

    # =====================
    # CP-07f: RNG seed support
    # =====================

    # RNG seed support
    seed_used: int
    if payload.shuffle or payload.seed is None:
        # Random seed per request (supports non-deterministic outputs)
        seed_used = int(secrets.randbelow(2**31 - 1))
    else:
        seed_used = int(payload.seed)
    rng = random.Random(seed_used)

    # Remaining minutes budget drives selection while still being random.
    remaining_minutes_by_title: dict[str, int] = {k: int(v) for k, v in target_minutes_by_title.items()}

    generated: List[GeneratedSession] = []
    MIN_SESSION = 20  # minutes
    # NOTE: All scheduling math in this module uses integer minutes.

    # Convert free intervals into a single sorted list of segments.
    segments: List[Tuple[int, int, int]] = []  # (day, start_min, end_min) using frontend day index
    for d in range(7):
        if d in (5, 6) and not include_weekends:
            continue
        for s, e in free_by_day[d]:
            segments.append((d, int(s), int(e)))
    segments.sort(key=lambda x: (x[0], x[1]))

    # =====================
    # CP-09: distribution + spacing rules
    # =====================

    # Low-priority anti-starvation: ensure each low priority course appears at least once if feasible.
    low_courses = [c for c in courses if c["priority"] == "low"]
    counts_by_title: dict[str, int] = {c["title"]: 0 for c in courses}

    # Stronger caps make the result feel much more realistic.
    CAP_SESSIONS_PER_DAY_PER_SUBJECT = 1
    MAX_SESSIONS_PER_WEEK_PER_SUBJECT = 3
    MAX_TOTAL_GENERATED_SESSIONS = max(6, min(18, len(courses) * 2))
    sessions_by_day_by_title: List[dict[str, int]] = [{c["title"]: 0 for c in courses} for _ in range(7)]

    last_subject: Optional[str] = None
    last_day: Optional[int] = None

    def schedule_in_segment(seg: Tuple[int, int, int], course: dict) -> Tuple[Optional[GeneratedSession], Optional[Tuple[int, int, int]]]:
        d, seg_start, seg_end = seg
        remaining = seg_end - seg_start
        if remaining < MIN_SESSION:
            return None, None

        pr = course["priority"]
        title = course["title"]

        preferred = int(base_chunk_minutes[pr])
        budget = int(remaining_minutes_by_title.get(title, 0))

        if budget >= MIN_SESSION:
            length = min(preferred, budget, remaining)
        elif budget > 0:
            # Allow one minimum slot even if budget is small.
            length = min(max(budget, MIN_SESSION), remaining)
        else:
            # For quota/overflow cases.
            length = min(preferred, remaining)
        # If we'd leave a tiny unusable tail, just fill the interval
        if remaining - length < MIN_SESSION:
            length = remaining
        if length < MIN_SESSION:
            return None, None

        start = seg_start
        end = seg_start + length
        sess = GeneratedSession(
            id=str(uuid.uuid4()),
            subject=course["title"],
            startTime=_minutes_to_hhmm(start),
            endTime=_minutes_to_hhmm(end),
            day=d,
            type="practice",
            color=_course_color(course["title"]),
            priority=pr,
        )

        next_start = end + break_mins
        if next_start < seg_end:
            return sess, (d, int(next_start), int(seg_end))
        return sess, None

    def push_front(remainder: Optional[Tuple[int, int, int]]) -> None:
        if remainder is None:
            return
        # remainder always belongs to the same segment and starts later than the popped segment start,
        # so it remains the earliest remaining segment for that day.
        segments.insert(0, remainder)

    # Phase 1: satisfy min quota for low priority courses
    missing_low: List[str] = []
    for c in low_courses:
        placed = False
        for i, seg in enumerate(list(segments)):
            d, _, _ = seg
            if sessions_by_day_by_title[d].get(c["title"], 0) >= CAP_SESSIONS_PER_DAY_PER_SUBJECT:
                continue
            sess, rem = schedule_in_segment(seg, c)
            if sess is None:
                continue
            generated.append(sess)
            counts_by_title[c["title"]] = counts_by_title.get(c["title"], 0) + 1
            sessions_by_day_by_title[sess.day][sess.subject] = sessions_by_day_by_title[sess.day].get(sess.subject, 0) + 1
            remaining_minutes_by_title[sess.subject] = int(remaining_minutes_by_title.get(sess.subject, 0)) - int(_to_minutes(_parse_hhmm(sess.endTime)) - _to_minutes(_parse_hhmm(sess.startTime)))
            # Update segments queue
            segments.pop(i)
            if rem is not None:
                segments.insert(i, rem)
            placed = True
            break
        if not placed:
            missing_low.append(c["title"])

    # Reset "last" trackers before main fill pass.
    last_subject, last_day = None, None

    def _pick_course_for_segment(day: int) -> Optional[dict]:
        # Prioritize any unmet low course quota (>=1/week) if still missing.
        unmet_low = [c for c in low_courses if counts_by_title.get(c["title"], 0) == 0]

        def eligible(c: dict) -> bool:
            title = c["title"]
            # Respect per-day cap when possible.
            if sessions_by_day_by_title[day].get(title, 0) >= CAP_SESSIONS_PER_DAY_PER_SUBJECT:
                return False
            if counts_by_title.get(title, 0) >= MAX_SESSIONS_PER_WEEK_PER_SUBJECT:
                return False
            # Prefer to schedule only if there is remaining budget, unless it's for unmet low quota.
            if remaining_minutes_by_title.get(title, 0) > 0:
                return True
            return c in unmet_low

        candidates = [c for c in courses if eligible(c)]
        if not candidates:
            # Relax cap if nothing is schedulable.
            candidates = [c for c in courses if remaining_minutes_by_title.get(c["title"], 0) > 0] or courses

        weights: List[float] = []
        for c in candidates:
            title = c["title"]
            base = float(max(0, remaining_minutes_by_title.get(title, 0)))
            if title in [x["title"] for x in unmet_low]:
                base = max(base, float(MIN_SESSION))

            # Spread sessions across the week: penalize repeating a subject within the same day.
            same_day_count = sessions_by_day_by_title[day].get(title, 0)
            spread_factor = 1.0 / (1.0 + same_day_count)

            # Avoid too many back-to-back sessions of the same subject.
            if last_subject == title and last_day == day:
                spread_factor *= 0.2

            w = max(0.0, base) * spread_factor
            weights.append(w)

        # If everything is 0 due to budgets, fall back to uniform random.
        if not any(w > 0 for w in weights):
            return rng.choice(candidates)

        return rng.choices(candidates, weights=weights, k=1)[0]

    while segments:
        if len(generated) >= MAX_TOTAL_GENERATED_SESSIONS:
            break
        if sum(max(0, int(v)) for v in remaining_minutes_by_title.values()) < MIN_SESSION:
            break

        seg = segments.pop(0)
        d, seg_start, seg_end = seg
        if seg_end - seg_start < MIN_SESSION:
            continue

        course = _pick_course_for_segment(d)
        if course is None:
            continue

        sess, rem = schedule_in_segment(seg, course)
        if sess is None:
            continue
        if len(generated) >= MAX_SESSIONS:
            break

        if total_minutes_used >= MAX_TOTAL_MINUTES:
            break

        course_id = str(course["id"])

        if subject_minutes.get(course_id, 0) >= PER_SUBJECT_MAX_MINUTES.get(course["priority"], 120):
            continue

        if (course_id, d) in subject_day_seen:
            continue
        # Update trackers
        generated.append(sess)
        counts_by_title[sess.subject] = counts_by_title.get(sess.subject, 0) + 1
        sessions_by_day_by_title[sess.day][sess.subject] = sessions_by_day_by_title[sess.day].get(sess.subject, 0) + 1

        # Decrement remaining budget for this course.
        try:
            length_mins = _to_minutes(_parse_hhmm(sess.endTime)) - _to_minutes(_parse_hhmm(sess.startTime))
        except Exception:
            length_mins = 0
        total_minutes_used += int(length_mins)
        subject_minutes[course_id] = subject_minutes.get(course_id, 0) + int(length_mins)
        subject_day_seen.add((course_id, d))
        sessions_created += 1
        remaining_minutes_by_title[sess.subject] = int(remaining_minutes_by_title.get(sess.subject, 0)) - int(length_mins)

        last_subject, last_day = sess.subject, sess.day
        push_front(rem)

    return {
        "sessions": [g.model_dump() for g in generated],
        "meta": {
            "seed": seed_used,
            "shuffle": bool(payload.shuffle),
            "include_weekends": include_weekends,
            "weekday_window": {"start": payload.window.weekdayStart, "end": payload.window.weekdayEnd},
            "weekend_window": {"start": _minutes_to_hhmm(we_start), "end": _minutes_to_hhmm(we_end)},
            "generated_count": len(generated),
            "courses": len(courses),
            "breakMinutes": break_mins,
            # CP-08: allocation drivers
            "allocation": {
                "horizon_days": 7,
                "total_available_minutes_week": int(total_available_minutes_week),
                "desired_study_minutes_week": int(desired_study_minutes_week),
                "targets_minutes_by_course": dict(target_minutes_by_title),
                "effective_weight_by_course": {k: round(float(v), 4) for k, v in effective_weight_by_title.items()},
                "urgency_score_by_course": {k: round(float(v), 4) for k, v in urgency_by_title.items()},
                "assessments_considered": assessments_meta,
            },
            # CP-09: distribution controls
            "distribution": {
                "cap_sessions_per_day_per_subject": CAP_SESSIONS_PER_DAY_PER_SUBJECT,
                "max_sessions_per_week_per_subject": MAX_SESSIONS_PER_WEEK_PER_SUBJECT,
                "max_total_generated_sessions": MAX_TOTAL_GENERATED_SESSIONS,
                "avoid_back_to_back_same_subject": True,
            },
            "low_priority_min_quota": 1,
            "low_priority_courses": len(low_courses),
            "low_priority_missing": missing_low,
        },
    }
