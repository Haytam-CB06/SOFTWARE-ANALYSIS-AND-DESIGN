from __future__ import annotations

from datetime import datetime, timezone
from typing import List, Literal, Optional

from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel, field_validator
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.assessment import Assessment
from app.models.subject import Subject
from app.models.user import User

router = APIRouter(prefix="/assessments", tags=["Assessments"])


def _guard_user(user_id: str, x_user_id: str, session: Session) -> None:
    if not x_user_id or x_user_id != user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")

    u = session.query(User).filter(User.id == user_id).first()
    if not u:
        raise HTTPException(status_code=404, detail="User not found")


def _difficulty_to_priority_label(difficulty: Optional[int]) -> Literal["low", "medium", "high"]:
    if difficulty is None:
        return "medium"
    if difficulty >= 4:
        return "high"
    if difficulty >= 2:
        return "medium"
    return "low"


def _parse_due_date(v: str) -> datetime:
    vv = (v or "").strip()
    if not vv:
        raise ValueError("dueDate is required")

    if vv.endswith("Z"):
        vv = vv[:-1] + "+00:00"

    # Date-only
    if len(vv) == 10 and vv[4] == "-" and vv[7] == "-":
        dt = datetime.fromisoformat(vv)
        return dt.replace(tzinfo=timezone.utc)

    dt = datetime.fromisoformat(vv)
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt


class AssessmentOut(BaseModel):
    id: str
    title: str
    subject: str
    type: Literal["assignment", "exam", "quiz", "project"]
    dueDate: str
    priority: Literal["low", "medium", "high"]
    completed: bool
    completedAt: Optional[str] = None


class AssessmentCreateIn(BaseModel):
    user_id: str
    subject: str
    type: Literal["assignment", "exam", "quiz", "project"]
    dueDate: str
    title: Optional[str] = None
    estimateHours: Optional[float] = None

    @field_validator("subject")
    @classmethod
    def _subject_non_empty(cls, v: str) -> str:
        v = (v or "").strip()
        if not v:
            raise ValueError("subject is required")
        return v

    @field_validator("dueDate")
    @classmethod
    def _due_date_ok(cls, v: str) -> str:
        _parse_due_date(v)
        return v


class AssessmentUpdateIn(BaseModel):
    user_id: str
    completed: bool


def _to_out(a: Assessment, subject_title: str, priority: str) -> AssessmentOut:
    return AssessmentOut(
        id=str(a.id),
        title=a.title,
        subject=subject_title,
        type=a.kind,
        dueDate=a.due_at.isoformat(),
        priority=priority,
        completed=bool(getattr(a, "is_completed", False)),
        completedAt=(a.completed_at.isoformat() if getattr(a, "completed_at", None) else None),
    )


@router.get("", response_model=dict)
def list_assessments(
    user_id: str,
    include_completed: bool = True,
    include_past: bool = True,
    session: Session = Depends(get_db),
    x_user_id: str = Header(..., alias="X-User-Id"),
):
    _guard_user(user_id, x_user_id, session)

    q = (
        session.query(Assessment, Subject)
        .join(Subject, Assessment.subject_id == Subject.id)
        .filter(Subject.user_id == user_id)
    )

    if not include_completed:
        q = q.filter(Assessment.is_completed == False)  # noqa: E712

    if not include_past:
        now = datetime.now(timezone.utc)
        q = q.filter(Assessment.due_at >= now)

    q = q.order_by(Assessment.due_at.asc())

    rows = q.all()
    out: List[AssessmentOut] = []
    for a, s in rows:
        subj_title = (getattr(s, "title", None) or getattr(s, "name", None) or "").strip() or "(Untitled)"
        priority = _difficulty_to_priority_label(getattr(s, "difficulty", None))
        out.append(_to_out(a, subj_title, priority))

    return {"assessments": [o.model_dump() for o in out]}


@router.post("", response_model=dict)
def create_assessment(
    payload: AssessmentCreateIn,
    session: Session = Depends(get_db),
    x_user_id: str = Header(..., alias="X-User-Id"),
):
    _guard_user(payload.user_id, x_user_id, session)

    subj = (
        session.query(Subject)
        .filter(
            Subject.user_id == payload.user_id,
            Subject.is_active == True,  # noqa: E712
            Subject.title == payload.subject,
        )
        .first()
    )
    if not subj:
        raise HTTPException(status_code=400, detail="Subject not found for this user")

    due_dt = _parse_due_date(payload.dueDate)

    title = (payload.title or "").strip()
    if not title:
        title = f"{payload.subject} {payload.type.capitalize()}"

    a = Assessment(
        subject_id=subj.id,
        kind=payload.type,
        title=title,
        due_at=due_dt,
        estimate_hours=payload.estimateHours,
    )
    session.add(a)
    session.flush()

    priority = _difficulty_to_priority_label(getattr(subj, "difficulty", None))
    return {"assessment": _to_out(a, payload.subject, priority).model_dump()}


@router.patch("/{assessment_id}", response_model=dict)
def update_assessment(
    assessment_id: str,
    payload: AssessmentUpdateIn,
    session: Session = Depends(get_db),
    x_user_id: str = Header(..., alias="X-User-Id"),
):
    _guard_user(payload.user_id, x_user_id, session)

    row = (
        session.query(Assessment, Subject)
        .join(Subject, Assessment.subject_id == Subject.id)
        .filter(Assessment.id == assessment_id, Subject.user_id == payload.user_id)
        .first()
    )
    if not row:
        raise HTTPException(status_code=404, detail="Assessment not found")

    a, s = row
    a.is_completed = payload.completed
    a.completed_at = datetime.now(timezone.utc) if payload.completed else None
    session.add(a)
    session.flush()

    subj_title = (getattr(s, "title", None) or getattr(s, "name", None) or "").strip() or "(Untitled)"
    priority = _difficulty_to_priority_label(getattr(s, "difficulty", None))
    return {"assessment": _to_out(a, subj_title, priority).model_dump()}


@router.delete("/{assessment_id}", response_model=dict)
def delete_assessment(
    assessment_id: str,
    user_id: str,
    session: Session = Depends(get_db),
    x_user_id: str = Header(..., alias="X-User-Id"),
):
    _guard_user(user_id, x_user_id, session)

    row = (
        session.query(Assessment, Subject)
        .join(Subject, Assessment.subject_id == Subject.id)
        .filter(Assessment.id == assessment_id, Subject.user_id == user_id)
        .first()
    )
    if not row:
        raise HTTPException(status_code=404, detail="Assessment not found")

    a, _s = row
    session.delete(a)
    session.flush()
    return {"ok": True}
