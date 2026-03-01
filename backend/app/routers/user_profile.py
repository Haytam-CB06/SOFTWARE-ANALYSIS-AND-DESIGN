from uuid import UUID
from pathlib import Path
import shutil

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Header
from fastapi.responses import FileResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.notification import Notification
from app.models.user import User
from app.models.user_profile import UserProfile
from app.models.preferences import Preferences


router = APIRouter(prefix="/user", tags=["user"])


# Store profile pictures on disk (no DB migration required).
UPLOAD_DIR = Path(__file__).resolve().parents[2] / "uploads" / "profile_pictures"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


def _profile_pic_path(user_id: str) -> Path | None:
    """Return the profile picture path for a user if one exists."""
    for ext in ("png", "jpg", "jpeg", "webp", "gif"):
        p = UPLOAD_DIR / f"{user_id}.{ext}"
        if p.exists():
            return p
    return None


def _profile_pic_url(user_id: str) -> str | None:
    p = _profile_pic_path(user_id)
    if not p:
        return None
    return f"/user/{user_id}/profile-picture"


def _require_same_user(path_user_id: str, x_user_id: str) -> None:
    """Lightweight auth guard used across the codebase.

    This project uses a header-based identity signal (X-User-Id) for several
    routers (workspaces/chat). We mirror that here so a user can only read/update
    their own profile data.
    """
    if not x_user_id:
        raise HTTPException(status_code=401, detail="Missing X-User-Id header")
    if path_user_id != x_user_id:
        raise HTTPException(status_code=403, detail="Forbidden")


class UserProfileResponse(BaseModel):
    id: str
    full_name: str | None = None
    email: str | None = None
    department: str | None = None
    date_of_birth: str | None = None
    gender: str | None = None
    profile_picture_url: str | None = None
    onboarding_completed: bool = False


class UserProfileUpdate(BaseModel):
    full_name: str | None = None
    department: str | None = None
    date_of_birth: str | None = None
    gender: str | None = None
    onboarding_completed: bool | None = None


class NotificationSettingsResponse(BaseModel):
    email_reminders_enabled: bool = True
    email_reminder_minutes_before: int = 10
    email_deadline_alerts_enabled: bool = True
    email_achievement_alerts_enabled: bool = True
    email_weekly_summary_enabled: bool = True


class NotificationSettingsUpdate(BaseModel):
    email_reminders_enabled: bool | None = None
    email_reminder_minutes_before: int | None = None
    email_deadline_alerts_enabled: bool | None = None
    email_achievement_alerts_enabled: bool | None = None
    email_weekly_summary_enabled: bool | None = None


@router.get("/{user_id}", response_model=UserProfileResponse)
def get_user_profile(
    user_id: str,
    db: Session = Depends(get_db),
    x_user_id: str = Header(..., alias="X-User-Id"),
):
    _require_same_user(user_id, x_user_id)
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
        profile_picture_url=_profile_pic_url(user_id),
        onboarding_completed=bool(getattr(user, "onboarding_completed", False)),
    )


@router.put("/{user_id}", response_model=UserProfileResponse)
def update_user_profile(
    user_id: str,
    payload: UserProfileUpdate,
    db: Session = Depends(get_db),
    x_user_id: str = Header(..., alias="X-User-Id"),
):
    _require_same_user(user_id, x_user_id)
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
    if payload.onboarding_completed is not None:
        user.onboarding_completed = payload.onboarding_completed

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
        profile_picture_url=_profile_pic_url(user_id),
        onboarding_completed=bool(getattr(user, "onboarding_completed", False)),
    )


@router.post("/{user_id}/profile-picture")
def upload_profile_picture(
    user_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    x_user_id: str = Header(..., alias="X-User-Id"),
):
    _require_same_user(user_id, x_user_id)
    """Upload/replace the user's profile picture.

    Stores the image on disk and serves it back via GET /user/{user_id}/profile-picture.
    """

    try:
        user_uuid = UUID(user_id)
    except Exception:
        raise HTTPException(status_code=422, detail="Invalid user_id")

    user = db.query(User).filter(User.id == user_uuid).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Please upload an image file")

    # Determine extension
    ext = (file.filename or "").split(".")[-1].lower() if file.filename else ""
    if ext not in {"png", "jpg", "jpeg", "webp", "gif"}:
        # fall back to content-type
        ct = (file.content_type or "").split("/")[-1].lower()
        ext = ct if ct in {"png", "jpg", "jpeg", "webp", "gif"} else "png"

    # Remove any existing file for that user
    existing = _profile_pic_path(user_id)
    if existing and existing.exists():
        try:
            existing.unlink()
        except Exception:
            pass

    target = UPLOAD_DIR / f"{user_id}.{ext}"

    # Limit to ~5MB to match frontend restriction
    max_bytes = 5 * 1024 * 1024 * 1024
    written = 0
    with target.open("wb") as out:
        while True:
            chunk = file.file.read(1024 * 1024)
            if not chunk:
                break
            written += len(chunk)
            if written > max_bytes:
                try:
                    target.unlink(missing_ok=True)  # py>=3.8
                except Exception:
                    pass
                raise HTTPException(status_code=400, detail="Image size must be <= 5MB")
            out.write(chunk)

    return {"profile_picture_url": _profile_pic_url(user_id)}


@router.get("/{user_id}/profile-picture")
def get_profile_picture(user_id: str, db: Session = Depends(get_db)):
    try:
        user_uuid = UUID(user_id)
    except Exception:
        raise HTTPException(status_code=422, detail="Invalid user_id")

    user = db.query(User).filter(User.id == user_uuid).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    p = _profile_pic_path(user_id)
    if not p:
        raise HTTPException(status_code=404, detail="Profile picture not found")

    media_type = {
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".webp": "image/webp",
        ".gif": "image/gif",
    }.get(p.suffix.lower(), "application/octet-stream")

    return FileResponse(str(p), media_type=media_type)


@router.delete("/{user_id}/profile-picture")
def delete_profile_picture(
    user_id: str,
    db: Session = Depends(get_db),
    x_user_id: str = Header(..., alias="X-User-Id"),
):
    _require_same_user(user_id, x_user_id)
    try:
        user_uuid = UUID(user_id)
    except Exception:
        raise HTTPException(status_code=422, detail="Invalid user_id")

    user = db.query(User).filter(User.id == user_uuid).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    p = _profile_pic_path(user_id)
    if p and p.exists():
        try:
            p.unlink()
        except Exception:
            pass
    return {"profile_picture_url": None}


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


@router.get("/{user_id}/notification-settings", response_model=NotificationSettingsResponse)
def get_notification_settings(
    user_id: str,
    db: Session = Depends(get_db),
    x_user_id: str = Header(..., alias="X-User-Id"),
):
    _require_same_user(user_id, x_user_id)
    try:
        user_uuid = UUID(user_id)
    except Exception:
        raise HTTPException(status_code=422, detail="Invalid user_id")

    # Ensure preference row exists
    prefs = db.query(Preferences).filter(Preferences.user_id == user_uuid).first()
    if prefs is None:
        prefs = Preferences(user_id=user_uuid)
        db.add(prefs)
        db.commit()
        db.refresh(prefs)

    return NotificationSettingsResponse(
        email_reminders_enabled=bool(prefs.email_reminders_enabled),
        email_reminder_minutes_before=int(prefs.email_reminder_minutes_before or 10),
        email_deadline_alerts_enabled=bool(getattr(prefs, 'email_deadline_alerts_enabled', True)),
        email_achievement_alerts_enabled=bool(getattr(prefs, 'email_achievement_alerts_enabled', True)),
        email_weekly_summary_enabled=bool(getattr(prefs, 'email_weekly_summary_enabled', True)),
    )


@router.put("/{user_id}/notification-settings", response_model=NotificationSettingsResponse)
def update_notification_settings(
    user_id: str,
    payload: NotificationSettingsUpdate,
    db: Session = Depends(get_db),
    x_user_id: str = Header(..., alias="X-User-Id"),
):
    _require_same_user(user_id, x_user_id)
    try:
        user_uuid = UUID(user_id)
    except Exception:
        raise HTTPException(status_code=422, detail="Invalid user_id")

    prefs = db.query(Preferences).filter(Preferences.user_id == user_uuid).first()
    if prefs is None:
        prefs = Preferences(user_id=user_uuid)
        db.add(prefs)
        db.commit()
        db.refresh(prefs)

    if payload.email_reminders_enabled is not None:
        prefs.email_reminders_enabled = bool(payload.email_reminders_enabled)
    if payload.email_reminder_minutes_before is not None:
        minutes = int(payload.email_reminder_minutes_before)
        if minutes < 0 or minutes > 1440:
            raise HTTPException(status_code=422, detail="email_reminder_minutes_before must be between 0 and 1440")
        prefs.email_reminder_minutes_before = minutes

    if payload.email_deadline_alerts_enabled is not None:
        prefs.email_deadline_alerts_enabled = bool(payload.email_deadline_alerts_enabled)

    if payload.email_achievement_alerts_enabled is not None:
        prefs.email_achievement_alerts_enabled = bool(payload.email_achievement_alerts_enabled)

    if payload.email_weekly_summary_enabled is not None:
        prefs.email_weekly_summary_enabled = bool(payload.email_weekly_summary_enabled)

    db.commit()

    # If user disabled reminders, cancel any pending upcoming session email reminders.
    if prefs.email_reminders_enabled is False:
        now = _utcnow()
        pending = (
            db.query(Notification)
            .filter(Notification.user_id == user_uuid)
            .filter(Notification.channel == "email")
            .filter(Notification.status == "pending")
            .filter(Notification.session_id.isnot(None))
            .filter(Notification.send_at >= now)
            .all()
        )
        for n in pending:
            n.status = "cancelled"
            n.error_message = "Disabled by user"
        db.commit()

    db.refresh(prefs)
    return NotificationSettingsResponse(
        email_reminders_enabled=bool(prefs.email_reminders_enabled),
        email_reminder_minutes_before=int(prefs.email_reminder_minutes_before or 10),
        email_deadline_alerts_enabled=bool(getattr(prefs, 'email_deadline_alerts_enabled', True)),
        email_achievement_alerts_enabled=bool(getattr(prefs, 'email_achievement_alerts_enabled', True)),
        email_weekly_summary_enabled=bool(getattr(prefs, 'email_weekly_summary_enabled', True)),
    )
