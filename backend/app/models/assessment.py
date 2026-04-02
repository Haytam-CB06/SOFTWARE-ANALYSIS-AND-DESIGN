import uuid

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Numeric, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import expression

from app.models.base import Base


class Assessment(Base):
    __tablename__ = "assessments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # FK to subjects ensures ownership is derived from Subject.user_id
    subject_id = Column(
        UUID(as_uuid=True),
        ForeignKey("subjects.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    kind = Column(Text, nullable=False)          # e.g. exam, quiz, assignment, project
    title = Column(Text, nullable=False)
    due_at = Column(DateTime(timezone=True), nullable=False)
    estimate_hours = Column(Numeric(5, 2))

    # Tracking placeholders (Story 5/6): keep it simple for now.
    is_completed = Column(
        Boolean,
        nullable=False,
        default=False,
        server_default=expression.false(),
        index=True,
    )
    completed_at = Column(DateTime(timezone=True), nullable=True)
