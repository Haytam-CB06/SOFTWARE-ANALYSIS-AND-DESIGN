import uuid
from sqlalchemy import Column, SmallInteger, Time, Text
from sqlalchemy.dialects.postgresql import UUID
from app.db.base import Base
from sqlalchemy import ForeignKey, Index
from sqlalchemy.orm import relationship


class ClassMeeting(Base):
    __tablename__ = "class_meetings"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    subject_id = Column(UUID(as_uuid=True), ForeignKey(
        "subjects.id", ondelete="CASCADE"), nullable=False)
    day_of_week = Column(SmallInteger, nullable=False)   # 0=Sun … 6=Sat
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    # optional recurrence rule
    rrule = Column(Text)

    subject = relationship("Subject", back_populates="class_meetings")

    __table_args__ = (
        Index('ix_class_meetings_subject_id', 'subject_id'),
        Index('ix_class_meetings_day_start', 'day_of_week', 'start_time'),
    )
