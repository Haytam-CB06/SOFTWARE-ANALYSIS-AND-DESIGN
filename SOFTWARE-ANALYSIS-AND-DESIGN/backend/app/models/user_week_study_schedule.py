import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.types import JSON

from app.models.base import Base


class UserWeekStudySchedule(Base):
    """Per-user, per-week study timetable sessions.

    IMPORTANT:
    - This table stores ONLY *study* sessions (manual + auto-generated).
    - Class schedules + busy blocks remain in Subject/ClassMeeting and UserBusyBlock
      and are used only as constraints for auto-generation.
    """

    __tablename__ = "user_week_study_schedules"
    __table_args__ = (
        UniqueConstraint("user_id", "week_id", name="uq_user_week_study_schedule"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    # week identifier used by the frontend (e.g. "2025-W45"). Treated as an opaque key.
    week_id = Column(Text, nullable=False)

    # Store the full session objects from the UI (type/color/deadline/etc.)
    sessions = Column(JSON, nullable=False, default=list)

    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.utcnow())
    updated_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.utcnow(),
        onupdate=lambda: datetime.utcnow(),
    )

    user = relationship("User", back_populates="week_study_schedules")
