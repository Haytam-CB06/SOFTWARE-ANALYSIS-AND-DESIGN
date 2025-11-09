import uuid
from sqlalchemy import Column, ForeignKey, String, Text, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from app.db import Base  # <-- fix: import from .base


class SessionFeedback(Base):
    __tablename__ = "session_feedback"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(UUID(as_uuid=True), ForeignKey(
        "study_sessions.id"), nullable=False)
    # e.g., "done" | "partial" | "skipped" (or keep your labels)
    rating = Column(String(10), nullable=False)
    comments = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

