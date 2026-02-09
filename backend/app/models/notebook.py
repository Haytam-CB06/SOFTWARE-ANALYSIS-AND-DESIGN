from sqlalchemy import Column, String, Text, DateTime, Boolean, Index
from sqlalchemy.sql import func
from app.models.base import Base  # adjust


class Note(Base):
    __tablename__ = "notes"

    id = Column(String, primary_key=True)          # uuid string
    user_id = Column(String, nullable=False, index=True)

    title = Column(String(200), nullable=False, default="")
    content = Column(Text, nullable=False, default="")

    # Optional "link" to something in the app (not shared, just a reference)
    entity_type = Column(String, nullable=True, index=True)  # e.g. session/course/workspace
    entity_id = Column(String, nullable=True, index=True)    # e.g. sessionId, courseId, workspaceId

    # Comma-separated tags (simple + fast). If you want relational tags later, we can migrate.
    tags = Column(String, nullable=False, default="")

    pinned = Column(Boolean, nullable=False, default=False)
    archived = Column(Boolean, nullable=False, default=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    __table_args__ = (
        Index("ix_notes_user_entity", "user_id", "entity_type", "entity_id"),
        Index("ix_notes_user_updated", "user_id", "updated_at"),
    )
