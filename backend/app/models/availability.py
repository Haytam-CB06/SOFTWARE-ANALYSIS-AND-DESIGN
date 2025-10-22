import uuid
from sqlalchemy import Column, Boolean, SmallInteger, Time, Date, Text
from sqlalchemy.dialects.postgresql import UUID
from .base import Base

class AvailabilityWindow(Base):
    __tablename__ = "availability_windows"
    id             = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id        = Column(UUID(as_uuid=True), nullable=False)
    is_blackout    = Column(Boolean, nullable=False, default=False)
    day_of_week    = Column(SmallInteger)  # 0..6
    start_time     = Column(Time)
    end_time       = Column(Time)
    effective_from = Column(Date)
    effective_to   = Column(Date)
    rrule          = Column(Text)
