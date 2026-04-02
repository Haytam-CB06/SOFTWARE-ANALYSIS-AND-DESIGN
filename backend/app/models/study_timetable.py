import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime, Boolean, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.types import JSON

from app.models.base import Base


class StudyTimetable(Base):
    """Persisted *study* timetables created from the frontend "Create Timetable" flow.

    The UI currently generates a rich payload (subjects, schedule, availability settings, etc.).
    Instead of trying to normalize every nested field, we store the complete payload in JSON.
    """

    __tablename__ = "study_timetables"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    # Human-friendly label (e.g., "Week 3 timetable", "Midterm prep")
    name = Column(Text, nullable=False)

    # Full timetable payload from the frontend (schedule, subjects, settings, etc.)
    data = Column(JSON, nullable=False)

    is_active = Column(Boolean, nullable=False, default=False)

    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.utcnow())
    updated_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.utcnow(), onupdate=lambda: datetime.utcnow())

    user = relationship("User", back_populates="study_timetables")
