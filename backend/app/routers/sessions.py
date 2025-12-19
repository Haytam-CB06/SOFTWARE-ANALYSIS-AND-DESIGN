from __future__ import annotations

from datetime import datetime
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, field_validator
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.study_session import StudySession


router = APIRouter(prefix="/sessions", tags=["sessions"])


class SessionCreateIn(BaseModel):
    user_id: UUID
    subject_id: Optional[UUID] = None
    start_at: datetime
    end_at: datetime
    source: str = "manual"  # manual | generated | edited
    notes: Optional[str] = None

    @field_validator("end_at")
    @classmethod
    def end_after_start(cls, v: datetime, info):
        start = info.data.get("start_at")
        if start and v <= start:
            raise ValueError("end_at must be after start_at")
        return v


class SessionOut(BaseModel):
    id: UUID
    user_id: UUID
    subject_id: Optional[UUID] = None
    source: str
    start_at: datetime
    end_at: datetime
    status: str
    locked: bool
    notes: Optional[str] = None

    model_config = {"from_attributes": True}


@router.post("/", response_model=SessionOut)
def create_session(payload: SessionCreateIn, db: Session = Depends(get_db)):
    s = StudySession(
        user_id=payload.user_id,
        subject_id=payload.subject_id,
        source=payload.source,
        start_at=payload.start_at,
        end_at=payload.end_at,
        status="planned",
        locked=False,
        notes=payload.notes,
    )
    db.add(s)
    db.commit()
    db.refresh(s)
    return s


@router.get("/", response_model=List[SessionOut])
def list_sessions(
    user_id: Optional[UUID] = Query(default=None),
    limit: int = Query(default=50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    q = db.query(StudySession)
    if user_id is not None:
        q = q.filter(StudySession.user_id == user_id)
    return q.order_by(StudySession.start_at.desc()).limit(limit).all()


@router.get("/{session_id}", response_model=SessionOut)
def get_session(session_id: UUID, db: Session = Depends(get_db)):
    s = db.query(StudySession).filter(StudySession.id == session_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Session not found")
    return s
