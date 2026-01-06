import uuid
from sqlalchemy import Column, Text, DateTime, SmallInteger
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

from app.models.base import Base


class Achievement(Base):
    __tablename__ = "achievements"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code = Column(Text, nullable=False, unique=True)  # stable key, e.g. 'streak_3'
    title = Column(Text, nullable=False)
    description = Column(Text, nullable=False)
    points = Column(SmallInteger, nullable=False, default=0)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
