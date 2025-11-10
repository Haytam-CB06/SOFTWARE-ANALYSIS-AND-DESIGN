import uuid
from sqlalchemy import Column, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.types import DateTime, Boolean
from app.db import Base


class StudySession(Base):
    __tablename__ = "study_sessions"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False)
    subject_id = Column(UUID(as_uuid=True))         # keep FK simple for now
    # 'generated'|'manual'|'edited'
    source = Column(Text, nullable=False, default="planned")
    start_at = Column(DateTime(timezone=True), nullable=False)
    end_at = Column(DateTime(timezone=True), nullable=False)
    # 'planned'|'completed'|'skipped'
    status = Column(Text, nullable=False, default="planned")
    locked = Column(Boolean, nullable=False, default=False)
    notes = Column(Text)
