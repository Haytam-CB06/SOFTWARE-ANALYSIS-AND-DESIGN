import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey, Text, func, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.models.base import Base


class User(Base):
    __tablename__ = "users"
 
    # UUID primary key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Temel bilgiler
    username = Column(String(50), unique=True, nullable=True)  # opsiyonel
    email = Column(Text, nullable=False, unique=True)
    full_name = Column(Text, nullable=True)
    gender = Column(Text, nullable=True)
    date_of_birth = Column(Text, nullable=True)
    timezone = Column(Text, nullable=False, default="UTC")
    password_hash = Column(String(255), nullable=True)
    reset_code = Column(String(6), nullable=True)
    reset_code_created_at = Column(DateTime(timezone=True), nullable=True)
    auth_provider = Column(String, nullable=False, default="local")


    # Onboarding
    onboarding_completed = Column(Boolean, nullable=False, default=False, server_default="false")

    # Global moderation (CP-08)
    # Added without full Alembic history; db.py backfills the column for existing DBs.
    is_banned = Column(Boolean, nullable=False, default=False, server_default="false")
    last_seen_at = Column(DateTime(timezone=True), nullable=True)

    # Tarihler
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True),
                        default=func.now(), onupdate=func.now())
    subjects = relationship("Subject", back_populates="user")

    # Study timetable JSON payloads saved from the "Create Timetable" / auto-generate flows
    # (see app/models/study_timetable.py)
    study_timetables = relationship(
        "StudyTimetable",
        back_populates="user",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    # Per-week study sessions for the CalendarView (manual + auto-generated)
    week_study_schedules = relationship(
        "UserWeekStudySchedule",
        back_populates="user",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )


    # İlişkiler
    login_history = relationship(
        "LoginHistory", back_populates="user", cascade="all, delete"
    )
    oauth_accounts = relationship("OAuthAccount",back_populates="user",cascade="all, delete")

    def __repr__(self):
        return f"<User(username='{self.username}', email='{self.email}')>"


class LoginHistory(Base):
    __tablename__ = "login_history"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey(
        "users.id", ondelete="CASCADE"), nullable=False)
    login_time = Column(DateTime(timezone=True), server_default=func.now())
    ip_address = Column(String(45), nullable=True)

    user = relationship("User", back_populates="login_history")

    def __repr__(self):
        return f"<LoginHistory(user_id={self.user_id}, ip_address='{self.ip_address}')>"
