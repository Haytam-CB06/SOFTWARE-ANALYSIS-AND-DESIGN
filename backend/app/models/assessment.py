import uuid
from sqlalchemy import Column, Text, Numeric, DateTime
from sqlalchemy.dialects.postgresql import UUID
from .base import Base

class Assessment(Base):
    __tablename__ = "assessments"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    subject_id = Column(UUID(as_uuid=True), nullable=False)
    kind = Column(Text, nullable=False)          # e.g. exam, quiz, assignment
    title = Column(Text, nullable=False)
    due_at = Column(DateTime(timezone=True), nullable=False)
    estimate_hours = Column(Numeric(5, 2))
