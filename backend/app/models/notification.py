import uuid
from sqlalchemy import Column, Text, DateTime
from sqlalchemy.dialects.postgresql import UUID
from .base import Base

class Notification(Base):
    __tablename__ = "notifications"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False)
    session_id = Column(UUID(as_uuid=True))          # optional link to a session
    channel = Column(Text, nullable=False)           # 'email' | 'push' | 'sms'
    template = Column(Text, nullable=False)          # 'session_reminder' | 'daily' | 'weekly'
    send_at = Column(DateTime(timezone=True), nullable=False)
    status = Column(Text, nullable=False, default="scheduled")
    error_message = Column(Text)
