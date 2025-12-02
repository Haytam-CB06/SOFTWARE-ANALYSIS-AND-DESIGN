import uuid
from sqlalchemy import Column, Text, DateTime
from sqlalchemy.dialects.postgresql import UUID
from app.models.base import Base


class CalendarEvent(Base):
    __tablename__ = "calendar_events"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    # links to study_sessions.id
    session_id = Column(UUID(as_uuid=True), nullable=False)
    provider = Column(Text, nullable=False)
    provider_calendar_id = Column(Text, nullable=False)
    provider_event_id = Column(Text, unique=True)
    # 'pending'|'synced'|'error'
    sync_state = Column(Text, nullable=False, default="synced")
    last_synced_at = Column(DateTime(timezone=True))
