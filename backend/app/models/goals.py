import uuid
from sqlalchemy import Column, ForeignKey, String, Integer, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from .base import Base  # <-- fix: import from .base

class Goal(Base):
    __tablename__ = "goals"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    title = Column(String(100), nullable=False)
    description = Column(String(255))
    target_hours = Column(Integer)
    achieved_hours = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
