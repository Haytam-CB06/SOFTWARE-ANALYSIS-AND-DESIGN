import uuid

from sqlalchemy import Column, Text, String, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.types import DateTime
from sqlalchemy.sql import text

from app.models.base import Base


class SessionFeedback(Base):
    __tablename__ = "session_feedback"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    # links to study_sessions.id
    session_id = Column(UUID(as_uuid=True), ForeignKey("study_sessions.id"), nullable=False)

    # keep in sync with migration: rating VARCHAR(10), comments TEXT, created_at timestamptz default now()
    rating = Column(String(10), nullable=False)
    comments = Column(Text, nullable=True)
    created_at = Column(
        DateTime(timezone=True),
        server_default=text("now()"),
        nullable=True,
    )
