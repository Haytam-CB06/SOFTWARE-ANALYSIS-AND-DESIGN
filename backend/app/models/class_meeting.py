import uuid
from sqlalchemy import Column, SmallInteger, Time, Text
from sqlalchemy.dialects.postgresql import UUID
from .base import Base

class ClassMeeting(Base):
    __tablename__ = "class_meetings"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    subject_id = Column(UUID(as_uuid=True), nullable=False)
    day_of_week = Column(SmallInteger, nullable=False)   # 0=Sun … 6=Sat
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    rrule = Column(Text)                                 # optional recurrence rule
