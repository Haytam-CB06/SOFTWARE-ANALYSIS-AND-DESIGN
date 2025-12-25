from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.study_timetable import StudyTimetable
from app.models.user import User


router = APIRouter(prefix="/study-timetables", tags=["Study Timetables"])


class StudyTimetableCreate(BaseModel):
    user_id: str
    name: str
    data: Dict[str, Any]


class StudyTimetableUpdate(BaseModel):
    name: Optional[str] = None
    data: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None


def _validate_uuid(value: str, field: str) -> None:
    try:
        uuid.UUID(value)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid {field} format")


def _serialize(t: StudyTimetable) -> Dict[str, Any]:
    return {
        "id": str(t.id),
        "user_id": str(t.user_id),
        "name": t.name,
        "is_active": bool(t.is_active),
        "created_at": t.created_at.isoformat() if t.created_at else None,
        "updated_at": t.updated_at.isoformat() if t.updated_at else None,
        "data": t.data or {},
    }


@router.get("/user/{user_id}")
def list_user_timetables(user_id: str, session: Session = Depends(get_db)):
    _validate_uuid(user_id, "user_id")
    timetables = (
        session.query(StudyTimetable)
        .filter(StudyTimetable.user_id == user_id)
        .order_by(StudyTimetable.created_at.desc())
        .all()
    )
    return {"timetables": [_serialize(t) for t in timetables]}


@router.get("/user/{user_id}/active")
def get_active_timetable(user_id: str, session: Session = Depends(get_db)):
    _validate_uuid(user_id, "user_id")
    t = (
        session.query(StudyTimetable)
        .filter(StudyTimetable.user_id == user_id, StudyTimetable.is_active == True)  # noqa: E712
        .order_by(StudyTimetable.updated_at.desc())
        .first()
    )
    if not t:
        return {"timetable": None}
    return {"timetable": _serialize(t)}


@router.post("")
def create_timetable(payload: StudyTimetableCreate, session: Session = Depends(get_db)):
    _validate_uuid(payload.user_id, "user_id")

    user = session.query(User).filter(User.id == payload.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Deactivate any existing active timetable for this user
    session.query(StudyTimetable).filter(
        StudyTimetable.user_id == payload.user_id, StudyTimetable.is_active == True  # noqa: E712
    ).update({StudyTimetable.is_active: False})

    t = StudyTimetable(
        user_id=payload.user_id,
        name=payload.name,
        data=payload.data,
        is_active=True,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    session.add(t)
    session.commit()
    session.refresh(t)
    return _serialize(t)


@router.put("/{timetable_id}")
def update_timetable(
    timetable_id: str, payload: StudyTimetableUpdate, session: Session = Depends(get_db)
):
    _validate_uuid(timetable_id, "timetable_id")
    t = session.query(StudyTimetable).filter(StudyTimetable.id == timetable_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Timetable not found")

    if payload.name is not None:
        t.name = payload.name
    if payload.data is not None:
        t.data = payload.data
    if payload.is_active is not None:
        if payload.is_active:
            # Deactivate others for the user
            session.query(StudyTimetable).filter(
                StudyTimetable.user_id == t.user_id, StudyTimetable.id != t.id
            ).update({StudyTimetable.is_active: False})
        t.is_active = payload.is_active

    t.updated_at = datetime.utcnow()
    session.commit()
    session.refresh(t)
    return _serialize(t)


@router.post("/{timetable_id}/activate")
def activate_timetable(timetable_id: str, session: Session = Depends(get_db)):
    _validate_uuid(timetable_id, "timetable_id")
    t = session.query(StudyTimetable).filter(StudyTimetable.id == timetable_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Timetable not found")

    session.query(StudyTimetable).filter(
        StudyTimetable.user_id == t.user_id, StudyTimetable.id != t.id
    ).update({StudyTimetable.is_active: False})

    t.is_active = True
    t.updated_at = datetime.utcnow()
    session.commit()
    session.refresh(t)
    return _serialize(t)


@router.delete("/{timetable_id}")
def delete_timetable(timetable_id: str, session: Session = Depends(get_db)):
    _validate_uuid(timetable_id, "timetable_id")
    t = session.query(StudyTimetable).filter(StudyTimetable.id == timetable_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Timetable not found")

    was_active = bool(t.is_active)
    user_id = str(t.user_id)
    session.delete(t)
    session.commit()

    # If deleted timetable was active, attempt to activate the newest one
    if was_active:
        newest = (
            session.query(StudyTimetable)
            .filter(StudyTimetable.user_id == user_id)
            .order_by(StudyTimetable.created_at.desc())
            .first()
        )
        if newest:
            newest.is_active = True
            newest.updated_at = datetime.utcnow()
            session.commit()

    return {"message": "Timetable deleted"}
