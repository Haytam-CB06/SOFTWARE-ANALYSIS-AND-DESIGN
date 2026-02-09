#board.py model
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from .base import Base
from sqlalchemy.orm import relationship

class BoardTask(Base):
    __tablename__ = "board_tasks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workspace_id = Column(Integer, ForeignKey("workspaces.id"))
    title = Column(String)
    description = Column(String)
    status = Column(String)
    priority = Column(String)
    assignee_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    labels = Column(ARRAY(String))
    attachments_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)

    comments = relationship(
    "BoardComment",
    back_populates="task",
    cascade="all, delete-orphan",
    passive_deletes=True
)


class BoardComment(Base):
    __tablename__ = "board_comments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    task_id = Column(UUID(as_uuid=True), ForeignKey("board_tasks.id", ondelete="CASCADE"))
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))   # renamed from created_by
    user_name = Column(String)
    text = Column(String)   # renamed from content
    created_at = Column(DateTime, default=datetime.utcnow)

    task = relationship("BoardTask", back_populates="comments")
