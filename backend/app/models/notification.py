import uuid
from sqlalchemy import Column, Text, DateTime
from sqlalchemy.dialects.postgresql import UUID
from app.models.base import Base


class Notification(Base):
    __tablename__ = "notifications"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False)
    # optional link to a session
    session_id = Column(UUID(as_uuid=True))
    channel = Column(Text, nullable=False)           # 'email' | 'push' | 'sms'
    # 'session_reminder' | 'daily' | 'weekly'
    template = Column(Text, nullable=False)
    send_at = Column(DateTime(timezone=True), nullable=False)
    status = Column(Text, nullable=False, default="pending")
    error_message = Column(Text)
