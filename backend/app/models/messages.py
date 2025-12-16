from sqlalchemy import Column, Integer, Text, DateTime, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime

from app.models.base import Base


class Message(Base):
    __tablename__ = "workspace_messages"

    id = Column(Integer, primary_key=True, index=True)

    # workspace_id is an int in your Workspace model
    workspace_id = Column(Integer, ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)

    # user_id is UUID in your schemas/users table usage
    user_id = Column(UUID(as_uuid=True), nullable=False, index=True)

    username = Column(String(100), nullable=False)
    content = Column(Text, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
