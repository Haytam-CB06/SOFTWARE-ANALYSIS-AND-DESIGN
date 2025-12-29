from __future__ import annotations

import re
import uuid
from datetime import time
from typing import List, Literal, Optional, Tuple

from fastapi import APIRouter, Depends, HTTPException, Header
from pydantic import BaseModel, field_validator
from sqlalchemy.orm import Session, selectinload

from app.db import get_db
from app.models.class_meeting import ClassMeeting
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

    # Minutes of break time between *consecutive generated study sessions*.
    # Treated as unavailable time during scheduling.
    breakMinutes: int = 10

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
        weight = {"high": 3, "medium": 2, "low": 1}[pr]
        courses.append({"title": title, "priority": pr, "weight": weight})

    if not courses:
        raise HTTPException(status_code=400, detail="No valid courses found")

    # Colors
    color_by_priority = {"low": "#10B981", "medium": "#F59E0B", "high": "#DC2626"}
    target_minutes = {"low": 30, "medium": 40, "high": 50}

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

    # Busy intervals from class schedule + busy blocks
    busy_by_day: List[List[Tuple[int, int]]] = [[] for _ in range(7)]  # frontend day index

    if payload.treat_class_schedule_as_busy:
        for s in subjects:
            for m in s.class_meetings:
                d = _backend_day_to_frontend(int(m.day_of_week))
                start_min = _to_minutes(m.start_time)
                end_min = _to_minutes(m.end_time)
                _add_interval_with_wrap(busy_by_day, d, start_min, end_min)

    # Stored busy blocks
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
        free_by_day[d] = _subtract_intervals(base, blocks)

    # Weighted round-robin course selector
    course_cycle: List[dict] = []
    for c in courses:
        course_cycle.extend([c] * int(c["weight"]))
    if not course_cycle:
        course_cycle = courses[:]
    cycle_idx = 0

    def next_course() -> dict:
        nonlocal cycle_idx
        c = course_cycle[cycle_idx % len(course_cycle)]
        cycle_idx += 1
        return c

    generated: List[GeneratedSession] = []
    MIN_SESSION = 20  # minutes
    # Break gap (in minutes) between *consecutive generated study sessions*.
    # NOTE: All scheduling math in this module uses integer minutes.
    break_mins: int = int(payload.breakMinutes or 0)

    for d in range(7):
        if d in (5, 6) and not include_weekends:
            continue
        for s, e in free_by_day[d]:
            cur = s
            while cur < e:
                remaining = e - cur
                if remaining < MIN_SESSION:
                    break

                course = next_course()
                pr = course["priority"]
                target = target_minutes[pr]

                length = min(target, remaining)
                # If we'd leave a tiny unusable tail, just fill the interval
                if remaining - length < MIN_SESSION:
                    length = remaining

                if length < MIN_SESSION:
                    break

                start = cur
                end = cur + length
                generated.append(
                    GeneratedSession(
                        id=str(uuid.uuid4()),
                        subject=course["title"],
                        startTime=_minutes_to_hhmm(start),
                        endTime=_minutes_to_hhmm(end),
                        day=d,
                        type="practice",
                        color=color_by_priority[pr],
                        priority=pr,
                    )
                )
                # Add a break gap between consecutive study sessions
                cur = end + break_mins

    return {
        "sessions": [g.model_dump() for g in generated],
        "meta": {
            "include_weekends": include_weekends,
            "weekday_window": {"start": payload.window.weekdayStart, "end": payload.window.weekdayEnd},
            "weekend_window": {"start": _minutes_to_hhmm(we_start), "end": _minutes_to_hhmm(we_end)},
            "generated_count": len(generated),
            "courses": len(courses),
            "breakMinutes": break_mins,
        },
    }
