from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.user import User
from app.models.user_profile import UserProfile


router = APIRouter(prefix="/user", tags=["user"])


class UserProfileResponse(BaseModel):
    id: str
    full_name: str | None = None
    email: str | None = None
    department: str | None = None
    date_of_birth: str | None = None
    gender: str | None = None


class UserProfileUpdate(BaseModel):
    full_name: str | None = None
    department: str | None = None
    date_of_birth: str | None = None
    gender: str | None = None


@router.get("/{user_id}", response_model=UserProfileResponse)
def get_user_profile(user_id: str, db: Session = Depends(get_db)):
    try:
        user_uuid = UUID(user_id)
    except Exception:
        raise HTTPException(status_code=422, detail="Invalid user_id")

    user = db.query(User).filter(User.id == user_uuid).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    profile = db.query(UserProfile).filter(UserProfile.user_id == user_uuid).first()
    department = profile.department if profile else None

    return UserProfileResponse(
        id=str(user.id),
        full_name=user.full_name,
        email=user.email,
        department=department,
        date_of_birth=user.date_of_birth,
        gender=user.gender,
    )


@router.put("/{user_id}", response_model=UserProfileResponse)
def update_user_profile(user_id: str, payload: UserProfileUpdate, db: Session = Depends(get_db)):
    try:
        user_uuid = UUID(user_id)
    except Exception:
        raise HTTPException(status_code=422, detail="Invalid user_id")

    user = db.query(User).filter(User.id == user_uuid).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Update core user fields
    if payload.full_name is not None:
        user.full_name = payload.full_name
    if payload.date_of_birth is not None:
        user.date_of_birth = payload.date_of_birth
    if payload.gender is not None:
        user.gender = payload.gender

    # Update / create profile row for department
    profile = db.query(UserProfile).filter(UserProfile.user_id == user_uuid).first()
    if not profile:
        profile = UserProfile(user_id=user_uuid)
        db.add(profile)
    if payload.department is not None:
        profile.department = payload.department

    db.commit()
    db.refresh(user)

    return UserProfileResponse(
        id=str(user.id),
        full_name=user.full_name,
        email=user.email,
        department=profile.department,
        date_of_birth=user.date_of_birth,
        gender=user.gender,
    )
