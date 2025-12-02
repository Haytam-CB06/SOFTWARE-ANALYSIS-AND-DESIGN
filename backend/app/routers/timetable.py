from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, selectinload
from sqlalchemy import and_, or_
from app.db import get_session
from app.models.class_meeting import ClassMeeting
from app.models.subject import Subject
from app.models.user import User
from pydantic import BaseModel
from datetime import time
from typing import List, Optional
import uuid

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
def get_user_timetable(user_id: str, session: Session = Depends(get_session)):
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
    session: Session = Depends(get_session)
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
def get_all_users_timetables(session: Session = Depends(get_session)):
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
    session: Session = Depends(get_session)
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
    session: Session = Depends(get_session)
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
    session: Session = Depends(get_session)
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
    session: Session = Depends(get_session)
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
    session: Session = Depends(get_session)
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
