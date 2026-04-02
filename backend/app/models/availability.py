# backend/app/models/availability.py
import uuid
from sqlalchemy import Column, ForeignKey, Boolean, SmallInteger, Time, Date, Text
from sqlalchemy.dialects.postgresql import UUID
from app.models.base import Base


class AvailabilityWindow(Base):
    __tablename__ = "availability_windows"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey(
        "users.id", ondelete="CASCADE"), nullable=False)
    is_blackout = Column(Boolean, nullable=False, default=False)
    # 0..6 (optional if using rrule)
    day_of_week = Column(SmallInteger)
    start_time = Column(Time)                        # local wall time
    end_time = Column(Time)
    # optional bounding dates
    effective_from = Column(Date)
    effective_to = Column(Date)
    # optional advanced recurrence rule
    rrule = Column(Text)
