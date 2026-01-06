"""Workspace message model.

This project has 2 different "chat" concepts:

1) Real-time rooms/messages (ChatRoom/ChatMessage in models/chat.py)
2) Workspace-scoped persistent messages used by routers/chat.py endpoints:
     - POST   /chat/workspaces/{workspace_id}/messages
     - GET    /chat/workspaces/{workspace_id}/messages
     - DELETE /chat/workspaces/messages/{message_id}

We keep the class name **Message** because the routers already import it
as `from app.models.message import Message`.
"""

import uuid
from datetime import datetime

from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.models.base import Base


class Message(Base):
    __tablename__ = "workspace_messages"

    id = Column(Integer, primary_key=True, index=True)

    # Workspace PK is Integer (models/workspace.py)
    workspace_id = Column(
        Integer,
        ForeignKey("workspaces.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # User PK is UUID (models/user.py)
    # Nullable so messages remain even if user is deleted.
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    # Stored for display/history
    username = Column(String(100), nullable=True)
    content = Column(Text, nullable=False)

    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False, index=True)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    workspace = relationship("Workspace", backref="workspace_messages")
