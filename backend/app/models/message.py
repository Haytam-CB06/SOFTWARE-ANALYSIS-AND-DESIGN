<<<<<<< HEAD
from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
=======
"""Workspace message model.

This is used by the "workspace chat" endpoints in routers/chat.py:
  - POST   /chat/workspaces/{workspace_id}/messages
  - GET    /chat/workspaces/{workspace_id}/messages
  - DELETE /chat/workspaces/messages/{message_id}

The project already has separate real-time chat models (ChatRoom/ChatMessage)
in models/chat.py. This Message model is specifically for *workspace-scoped*
messages stored in the DB.
"""

import uuid
from datetime import datetime

from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
>>>>>>> 25b55ef (done)

from app.models.base import Base


class Message(Base):
<<<<<<< HEAD
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    workspace_id = Column(Integer, ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)

    # NOTE: User IDs in this project are UUIDs (users.id). Keep this aligned.
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)

    username = Column(String(50), nullable=True)
    content = Column(Text, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    workspace = relationship("Workspace", backref="messages")
=======
    __tablename__ = "workspace_messages"

    id = Column(Integer, primary_key=True, index=True)

    # Workspace is an Integer PK in models/workspace.py
    workspace_id = Column(
        Integer,
        ForeignKey("workspaces.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # User is UUID PK in models/user.py
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    # Kept for convenience (historical display) even if user is deleted.
    username = Column(String(100), nullable=True)

    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
>>>>>>> 25b55ef (done)
