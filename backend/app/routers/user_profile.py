import os
from uuid import UUID
from pathlib import Path
import shutil
from collections import defaultdict

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Header
from fastapi.responses import FileResponse
from itsdangerous import URLSafeTimedSerializer
from pydantic import BaseModel
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.notification import Notification
from app.models.direct_message import DirectConversationPreference, DirectMessage
from app.models.friendship import Friendship
from app.models.study_session import StudySession
from app.models.user import User
from app.models.user_profile import UserProfile
from app.models.preferences import Preferences


router = APIRouter(prefix="/user", tags=["user"])
ONLINE_WINDOW = 120


# Store profile pictures on disk (no DB migration required).
UPLOAD_DIR = Path(__file__).resolve().parents[2] / "uploads" / "profile_pictures"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
SECRET_KEY = os.getenv("SECRET_KEY", os.getenv("SESSION_SECRET", "dev-secret-key"))
FRIEND_SALT = "uplan-friend-link"
friend_serializer = URLSafeTimedSerializer(SECRET_KEY)


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
    username: str | None = None
    email: str | None = None
    department: str | None = None
    profile_title: str | None = None
    background_theme: str | None = None
    date_of_birth: str | None = None
    gender: str | None = None
    profile_picture_url: str | None = None
    onboarding_completed: bool = False


class PublicProfileResponse(BaseModel):
    id: str
    full_name: str | None = None
    username: str | None = None
    email: str | None = None
    profile_picture_url: str | None = None
    profile_title: str | None = None
    background_theme: str | None = None
    completed_hours: float = 0.0
    most_productive_week: str | None = None
    most_productive_week_hours: float = 0.0
    most_productive_month: str | None = None
    most_productive_month_hours: float = 0.0
    joined_at: str | None = None
    friendship_status: str = "none"
    friends_since: str | None = None
    last_seen_at: str | None = None
    is_online: bool = False


class FriendResponse(BaseModel):
    friendship_id: str
    id: str
    full_name: str | None = None
    username: str | None = None
    email: str | None = None
    profile_picture_url: str | None = None
    completed_hours: float = 0.0
    status: str
    friends_since: str | None = None
    requested_at: str | None = None
    direction: str
    last_seen_at: str | None = None
    is_online: bool = False


class PresenceResponse(BaseModel):
    user_id: str
    last_seen_at: str
    is_online: bool = True


class DirectMessageIn(BaseModel):
    content: str


class DirectMessageResponse(BaseModel):
    id: int
    sender_id: str
    recipient_id: str
    content: str
    created_at: str | None = None
    read_at: str | None = None


class DirectConversationResponse(BaseModel):
    friend: FriendResponse
    last_message: DirectMessageResponse | None = None
    unread_count: int = 0
    nickname: str | None = None
    pinned: bool = False


class DirectConversationPreferenceIn(BaseModel):
    nickname: str | None = None
    pinned: bool | None = None


class UserProfileUpdate(BaseModel):
    full_name: str | None = None
    username: str | None = None
    department: str | None = None
    profile_title: str | None = None
    background_theme: str | None = None
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


def _completed_hours(db: Session, user_uuid: UUID) -> float:
    sessions = (
        db.query(StudySession)
        .filter(StudySession.user_id == user_uuid, StudySession.status == "completed")
        .all()
    )
    total_seconds = 0
    for session in sessions:
        seconds = getattr(session, "actual_duration_seconds", None)
        if seconds is None and getattr(session, "start_at", None) and getattr(session, "end_at", None):
            seconds = max(0, int((session.end_at - session.start_at).total_seconds()))
        total_seconds += int(seconds or 0)
    return round(total_seconds / 3600, 2)


def _study_stats(db: Session, user_uuid: UUID) -> dict[str, object]:
    sessions = (
        db.query(StudySession)
        .filter(StudySession.user_id == user_uuid, StudySession.status == "completed")
        .all()
    )
    total_seconds = 0
    week_seconds: dict[str, int] = defaultdict(int)
    month_seconds: dict[str, int] = defaultdict(int)

    for session in sessions:
        seconds = getattr(session, "actual_duration_seconds", None)
        if seconds is None and getattr(session, "start_at", None) and getattr(session, "end_at", None):
            seconds = max(0, int((session.end_at - session.start_at).total_seconds()))
        seconds = int(seconds or 0)
        total_seconds += seconds

        start_at = _normalize_dt(getattr(session, "start_at", None))
        if start_at:
            iso_year, iso_week, _ = start_at.isocalendar()
            week_seconds[f"{iso_year}-W{iso_week:02d}"] += seconds
            month_seconds[start_at.strftime("%B %Y")] += seconds

    best_week = max(week_seconds.items(), key=lambda item: item[1], default=(None, 0))
    best_month = max(month_seconds.items(), key=lambda item: item[1], default=(None, 0))
    return {
        "completed_hours": round(total_seconds / 3600, 2),
        "most_productive_week": best_week[0],
        "most_productive_week_hours": round(best_week[1] / 3600, 2),
        "most_productive_month": best_month[0],
        "most_productive_month_hours": round(best_month[1] / 3600, 2),
    }


def _normalize_dt(value: datetime | None) -> datetime | None:
    if not value:
        return None
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value


def _is_user_online(user: User | None) -> bool:
    last_seen = _normalize_dt(getattr(user, "last_seen_at", None))
    if not last_seen:
        return False
    return (datetime.now(timezone.utc) - last_seen).total_seconds() <= ONLINE_WINDOW


def _last_seen_iso(user: User | None) -> str | None:
    last_seen = _normalize_dt(getattr(user, "last_seen_at", None))
    return last_seen.isoformat() if last_seen else None


def _ordered_friendship_query(db: Session, user_a: UUID, user_b: UUID):
    return db.query(Friendship).filter(
        or_(
            (Friendship.requester_id == user_a) & (Friendship.addressee_id == user_b),
            (Friendship.requester_id == user_b) & (Friendship.addressee_id == user_a),
        )
    )


def _friendship_status(friendship: Friendship | None, viewer_id: UUID) -> tuple[str, str | None]:
    if not friendship:
        return "none", None
    if friendship.status == "accepted":
        return "friends", friendship.accepted_at.isoformat() if friendship.accepted_at else None
    if friendship.requester_id == viewer_id:
        return "pending_sent", None
    return "pending_received", None


def _public_profile_out(db: Session, user: User, viewer_id: UUID | None = None) -> PublicProfileResponse:
    friendship = None
    if viewer_id and viewer_id != user.id:
        friendship = _ordered_friendship_query(db, viewer_id, user.id).first()
    status, friends_since = ("self", None) if viewer_id == user.id else _friendship_status(friendship, viewer_id) if viewer_id else ("none", None)
    profile = db.query(UserProfile).filter(UserProfile.user_id == user.id).first()
    stats = _study_stats(db, user.id)
    return PublicProfileResponse(
        id=str(user.id),
        full_name=user.full_name,
        username=user.username,
        email=user.email,
        profile_picture_url=_profile_pic_url(str(user.id)),
        profile_title=(profile.profile_title if profile else None) or "Senior Developer",
        background_theme=(profile.background_theme if profile else None) or "aurora",
        completed_hours=float(stats["completed_hours"]),
        most_productive_week=stats["most_productive_week"],
        most_productive_week_hours=float(stats["most_productive_week_hours"]),
        most_productive_month=stats["most_productive_month"],
        most_productive_month_hours=float(stats["most_productive_month_hours"]),
        joined_at=user.created_at.isoformat() if getattr(user, "created_at", None) else None,
        friendship_status=status,
        friends_since=friends_since,
        last_seen_at=_last_seen_iso(user),
        is_online=_is_user_online(user),
    )


def _friend_out(db: Session, friendship: Friendship, viewer_id: UUID) -> FriendResponse:
    other_id = friendship.addressee_id if friendship.requester_id == viewer_id else friendship.requester_id
    other = db.query(User).filter(User.id == other_id).first()
    direction = "sent" if friendship.requester_id == viewer_id else "received"
    return FriendResponse(
        friendship_id=str(friendship.id),
        id=str(other_id),
        full_name=getattr(other, "full_name", None) if other else None,
        username=getattr(other, "username", None) if other else None,
        email=getattr(other, "email", None) if other else None,
        profile_picture_url=_profile_pic_url(str(other_id)),
        completed_hours=_completed_hours(db, other_id),
        status=friendship.status,
        friends_since=friendship.accepted_at.isoformat() if friendship.accepted_at else None,
        requested_at=friendship.created_at.isoformat() if friendship.created_at else None,
        direction=direction,
        last_seen_at=_last_seen_iso(other),
        is_online=_is_user_online(other),
    )


def _require_accepted_friendship(db: Session, user_a: UUID, user_b: UUID) -> Friendship:
    friendship = _ordered_friendship_query(db, user_a, user_b).first()
    if not friendship or friendship.status != "accepted":
        raise HTTPException(status_code=403, detail="Direct messages are only available between friends")
    return friendship


def _direct_message_out(message: DirectMessage) -> DirectMessageResponse:
    return DirectMessageResponse(
        id=message.id,
        sender_id=str(message.sender_id),
        recipient_id=str(message.recipient_id),
        content=message.content,
        created_at=message.created_at.isoformat() if message.created_at else None,
        read_at=message.read_at.isoformat() if message.read_at else None,
    )


def _conversation_preference(db: Session, user_id: UUID, friend_id: UUID) -> DirectConversationPreference | None:
    return (
        db.query(DirectConversationPreference)
        .filter(
            DirectConversationPreference.user_id == user_id,
            DirectConversationPreference.friend_id == friend_id,
        )
        .first()
    )


@router.post("/{user_id}/presence", response_model=PresenceResponse)
def touch_user_presence(
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

    user.last_seen_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(user)
    return PresenceResponse(user_id=str(user.id), last_seen_at=user.last_seen_at.isoformat(), is_online=True)


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
        username=user.username,
        email=user.email,
        department=department,
        profile_title=profile.profile_title if profile else None,
        background_theme=profile.background_theme if profile else None,
        date_of_birth=user.date_of_birth,
        gender=user.gender,
        profile_picture_url=_profile_pic_url(user_id),
        onboarding_completed=bool(getattr(user, "onboarding_completed", False)),
    )


@router.get("/{user_id}/conversations", response_model=list[DirectConversationResponse])
def list_direct_conversations(
    user_id: str,
    db: Session = Depends(get_db),
    x_user_id: str = Header(..., alias="X-User-Id"),
):
    _require_same_user(user_id, x_user_id)
    try:
        viewer_uuid = UUID(user_id)
    except Exception:
        raise HTTPException(status_code=422, detail="Invalid user_id")

    friendships = (
        db.query(Friendship)
        .filter(
            Friendship.status == "accepted",
            or_(
                Friendship.requester_id == viewer_uuid,
                Friendship.addressee_id == viewer_uuid,
            ),
        )
        .order_by(Friendship.accepted_at.desc().nullslast(), Friendship.created_at.desc())
        .all()
    )

    conversations: list[DirectConversationResponse] = []
    for friendship in friendships:
        friend_id = friendship.addressee_id if friendship.requester_id == viewer_uuid else friendship.requester_id
        last_message = (
            db.query(DirectMessage)
            .filter(
                or_(
                    (DirectMessage.sender_id == viewer_uuid) & (DirectMessage.recipient_id == friend_id),
                    (DirectMessage.sender_id == friend_id) & (DirectMessage.recipient_id == viewer_uuid),
                )
            )
            .order_by(DirectMessage.created_at.desc(), DirectMessage.id.desc())
            .first()
        )
        unread_count = (
            db.query(func.count(DirectMessage.id))
            .filter(
                DirectMessage.sender_id == friend_id,
                DirectMessage.recipient_id == viewer_uuid,
                DirectMessage.read_at.is_(None),
            )
            .scalar()
            or 0
        )
        conversations.append(
            DirectConversationResponse(
                friend=_friend_out(db, friendship, viewer_uuid),
                last_message=_direct_message_out(last_message) if last_message else None,
                unread_count=int(unread_count),
                nickname=getattr(_conversation_preference(db, viewer_uuid, friend_id), "nickname", None),
                pinned=bool(getattr(_conversation_preference(db, viewer_uuid, friend_id), "pinned", False)),
            )
        )

    conversations.sort(
        key=lambda conversation: (
            "1" if conversation.pinned else "0",
            conversation.last_message.created_at
            if conversation.last_message and conversation.last_message.created_at
            else conversation.friend.friends_since or conversation.friend.requested_at or ""
        ),
        reverse=True,
    )
    return conversations


@router.patch("/{user_id}/conversations/{friend_user_id}/preferences", response_model=DirectConversationResponse)
def update_direct_conversation_preference(
    user_id: str,
    friend_user_id: str,
    payload: DirectConversationPreferenceIn,
    db: Session = Depends(get_db),
    x_user_id: str = Header(..., alias="X-User-Id"),
):
    _require_same_user(user_id, x_user_id)
    try:
        viewer_uuid = UUID(user_id)
        friend_uuid = UUID(friend_user_id)
    except Exception:
        raise HTTPException(status_code=422, detail="Invalid user_id")

    _require_accepted_friendship(db, viewer_uuid, friend_uuid)
    preference = _conversation_preference(db, viewer_uuid, friend_uuid)
    if not preference:
        preference = DirectConversationPreference(user_id=viewer_uuid, friend_id=friend_uuid)
        db.add(preference)

    if payload.nickname is not None:
        nickname = payload.nickname.strip()
        preference.nickname = nickname[:80] if nickname else None
    if payload.pinned is not None:
        preference.pinned = bool(payload.pinned)

    db.commit()
    db.refresh(preference)

    friendship = _ordered_friendship_query(db, viewer_uuid, friend_uuid).first()
    last_message = (
        db.query(DirectMessage)
        .filter(
            or_(
                (DirectMessage.sender_id == viewer_uuid) & (DirectMessage.recipient_id == friend_uuid),
                (DirectMessage.sender_id == friend_uuid) & (DirectMessage.recipient_id == viewer_uuid),
            )
        )
        .order_by(DirectMessage.created_at.desc(), DirectMessage.id.desc())
        .first()
    )
    unread_count = (
        db.query(func.count(DirectMessage.id))
        .filter(
            DirectMessage.sender_id == friend_uuid,
            DirectMessage.recipient_id == viewer_uuid,
            DirectMessage.read_at.is_(None),
        )
        .scalar()
        or 0
    )
    return DirectConversationResponse(
        friend=_friend_out(db, friendship, viewer_uuid),
        last_message=_direct_message_out(last_message) if last_message else None,
        unread_count=int(unread_count),
        nickname=preference.nickname,
        pinned=bool(preference.pinned),
    )


@router.get("/{user_id}/public-profile", response_model=PublicProfileResponse)
def get_public_profile(
    user_id: str,
    db: Session = Depends(get_db),
    x_user_id: str = Header(..., alias="X-User-Id"),
):
    try:
        target_uuid = UUID(user_id)
        viewer_uuid = UUID(x_user_id)
    except Exception:
        raise HTTPException(status_code=422, detail="Invalid user_id")

    viewer = db.query(User).filter(User.id == viewer_uuid).first()
    target = db.query(User).filter(User.id == target_uuid).first()
    if not viewer:
        raise HTTPException(status_code=401, detail="Invalid user")
    if not target:
        raise HTTPException(status_code=404, detail="User not found")

    return _public_profile_out(db, target, viewer_uuid)


@router.get("/{user_id}/friends", response_model=list[FriendResponse])
def list_friends(
    user_id: str,
    db: Session = Depends(get_db),
    x_user_id: str = Header(..., alias="X-User-Id"),
):
    _require_same_user(user_id, x_user_id)
    try:
        user_uuid = UUID(user_id)
    except Exception:
        raise HTTPException(status_code=422, detail="Invalid user_id")

    friendships = (
        db.query(Friendship)
        .filter(
            or_(
                Friendship.requester_id == user_uuid,
                Friendship.addressee_id == user_uuid,
            )
        )
        .order_by(Friendship.created_at.desc())
        .all()
    )
    return [_friend_out(db, friendship, user_uuid) for friendship in friendships]


@router.post("/{user_id}/friend-link")
def create_friend_link(
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

    token = friend_serializer.dumps({"user_id": str(user_uuid)}, salt=FRIEND_SALT)
    return {"token": token}


@router.post("/{user_id}/friend-link/{token}")
def accept_friend_link(
    user_id: str,
    token: str,
    db: Session = Depends(get_db),
    x_user_id: str = Header(..., alias="X-User-Id"),
):
    _require_same_user(user_id, x_user_id)
    try:
        viewer_uuid = UUID(user_id)
        payload = friend_serializer.loads(token, salt=FRIEND_SALT, max_age=60 * 60 * 24 * 30)
        target_uuid = UUID(str(payload.get("user_id")))
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid or expired friend link")

    if viewer_uuid == target_uuid:
        raise HTTPException(status_code=400, detail="You cannot add yourself as a friend")

    viewer = db.query(User).filter(User.id == viewer_uuid).first()
    target = db.query(User).filter(User.id == target_uuid).first()
    if not viewer or not target:
        raise HTTPException(status_code=404, detail="User not found")

    friendship = _ordered_friendship_query(db, viewer_uuid, target_uuid).first()
    now = datetime.now(timezone.utc)
    if friendship:
        if friendship.status != "accepted":
            friendship.status = "accepted"
            friendship.accepted_at = now
        db.commit()
        db.refresh(friendship)
        return {"message": "Friend added", "friend": _friend_out(db, friendship, viewer_uuid)}

    friendship = Friendship(
        requester_id=target_uuid,
        addressee_id=viewer_uuid,
        status="accepted",
        accepted_at=now,
    )
    db.add(friendship)
    db.commit()
    db.refresh(friendship)
    return {"message": "Friend added", "friend": _friend_out(db, friendship, viewer_uuid)}


@router.post("/{user_id}/friends/{target_user_id}")
def request_friend(
    user_id: str,
    target_user_id: str,
    db: Session = Depends(get_db),
    x_user_id: str = Header(..., alias="X-User-Id"),
):
    _require_same_user(user_id, x_user_id)
    try:
        viewer_uuid = UUID(user_id)
        target_uuid = UUID(target_user_id)
    except Exception:
        raise HTTPException(status_code=422, detail="Invalid user_id")

    if viewer_uuid == target_uuid:
        raise HTTPException(status_code=400, detail="You cannot add yourself as a friend")

    target = db.query(User).filter(User.id == target_uuid).first()
    if not target:
        raise HTTPException(status_code=404, detail="User not found")

    friendship = _ordered_friendship_query(db, viewer_uuid, target_uuid).first()
    if friendship:
        return {"message": "Friendship already exists", "friend": _friend_out(db, friendship, viewer_uuid)}

    friendship = Friendship(requester_id=viewer_uuid, addressee_id=target_uuid, status="pending")
    db.add(friendship)
    db.commit()
    db.refresh(friendship)
    return {"message": "Friend request sent", "friend": _friend_out(db, friendship, viewer_uuid)}


@router.post("/{user_id}/friends/{target_user_id}/accept")
def accept_friend_request(
    user_id: str,
    target_user_id: str,
    db: Session = Depends(get_db),
    x_user_id: str = Header(..., alias="X-User-Id"),
):
    _require_same_user(user_id, x_user_id)
    try:
        viewer_uuid = UUID(user_id)
        target_uuid = UUID(target_user_id)
    except Exception:
        raise HTTPException(status_code=422, detail="Invalid user_id")

    friendship = (
        db.query(Friendship)
        .filter(
            Friendship.requester_id == target_uuid,
            Friendship.addressee_id == viewer_uuid,
        )
        .first()
    )
    if not friendship:
        raise HTTPException(status_code=404, detail="Friend request not found")

    friendship.status = "accepted"
    friendship.accepted_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(friendship)
    return {"message": "Friend request accepted", "friend": _friend_out(db, friendship, viewer_uuid)}


@router.get("/{user_id}/conversations/{friend_user_id}/messages", response_model=list[DirectMessageResponse])
def list_direct_messages(
    user_id: str,
    friend_user_id: str,
    db: Session = Depends(get_db),
    x_user_id: str = Header(..., alias="X-User-Id"),
):
    _require_same_user(user_id, x_user_id)
    try:
        viewer_uuid = UUID(user_id)
        friend_uuid = UUID(friend_user_id)
    except Exception:
        raise HTTPException(status_code=422, detail="Invalid user_id")

    if viewer_uuid == friend_uuid:
        raise HTTPException(status_code=400, detail="Choose another user to message")

    friend = db.query(User).filter(User.id == friend_uuid).first()
    if not friend:
        raise HTTPException(status_code=404, detail="User not found")
    _require_accepted_friendship(db, viewer_uuid, friend_uuid)

    messages = (
        db.query(DirectMessage)
        .filter(
            or_(
                (DirectMessage.sender_id == viewer_uuid) & (DirectMessage.recipient_id == friend_uuid),
                (DirectMessage.sender_id == friend_uuid) & (DirectMessage.recipient_id == viewer_uuid),
            )
        )
        .order_by(DirectMessage.created_at.asc(), DirectMessage.id.asc())
        .limit(200)
        .all()
    )

    now = datetime.now(timezone.utc)
    changed = False
    for message in messages:
        if message.recipient_id == viewer_uuid and message.read_at is None:
            message.read_at = now
            changed = True
    if changed:
        db.commit()
        for message in messages:
            db.refresh(message)

    return [_direct_message_out(message) for message in messages]


@router.post("/{user_id}/conversations/{friend_user_id}/messages", response_model=DirectMessageResponse)
def send_direct_message(
    user_id: str,
    friend_user_id: str,
    payload: DirectMessageIn,
    db: Session = Depends(get_db),
    x_user_id: str = Header(..., alias="X-User-Id"),
):
    _require_same_user(user_id, x_user_id)
    try:
        viewer_uuid = UUID(user_id)
        friend_uuid = UUID(friend_user_id)
    except Exception:
        raise HTTPException(status_code=422, detail="Invalid user_id")

    content = (payload.content or "").strip()
    if not content:
        raise HTTPException(status_code=400, detail="Message content cannot be empty")
    if len(content) > 4000:
        raise HTTPException(status_code=400, detail="Message is too long")
    if viewer_uuid == friend_uuid:
        raise HTTPException(status_code=400, detail="Choose another user to message")

    friend = db.query(User).filter(User.id == friend_uuid).first()
    if not friend:
        raise HTTPException(status_code=404, detail="User not found")
    _require_accepted_friendship(db, viewer_uuid, friend_uuid)

    message = DirectMessage(sender_id=viewer_uuid, recipient_id=friend_uuid, content=content)
    db.add(message)
    db.commit()
    db.refresh(message)
    return _direct_message_out(message)


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
    if payload.username is not None:
        username = payload.username.strip() or None
        if username:
            existing = db.query(User).filter(User.username == username, User.id != user_uuid).first()
            if existing:
                raise HTTPException(status_code=409, detail="Username is already taken")
        user.username = username
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
    if payload.profile_title is not None:
        profile.profile_title = (payload.profile_title or "").strip() or None
    if payload.background_theme is not None:
        profile.background_theme = (payload.background_theme or "").strip() or None

    db.commit()
    db.refresh(user)

    return UserProfileResponse(
        id=str(user.id),
        full_name=user.full_name,
        username=user.username,
        email=user.email,
        department=profile.department,
        profile_title=profile.profile_title,
        background_theme=profile.background_theme,
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
