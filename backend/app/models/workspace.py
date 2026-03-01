from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, Enum, ForeignKey, UniqueConstraint, Boolean
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime
import enum
import uuid
from sqlalchemy.dialects.postgresql import UUID
from app.models.base import Base
from sqlalchemy.orm import relationship

class RoleEnum(enum.Enum):
    admin = "admin"
    member = "member"


class Workspace(Base):
    __tablename__ = "workspaces"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    owner_id = Column(UUID(as_uuid=True), nullable=True)

    # ✅ NEW: parent workspace (null means "top-level workspace")
    parent_id = Column(Integer, ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=True, index=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    share_link_enabled = Column(Boolean, default=False, nullable=False)
    share_link_version = Column(Integer, default=1, nullable=False)
    # ✅ relationships (optional but very useful)
    parent = relationship("Workspace", remote_side=[id], backref="subworkspaces")





class MemberPermission(Base):
    __tablename__ = "member_permissions"

    id = Column(Integer, primary_key=True, index=True)
    workspace_member_id = Column(Integer, ForeignKey(
        "workspace_members.id", ondelete="CASCADE"), nullable=False, index=True)
    permission_name = Column(String(50), nullable=False)
    is_granted = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    member = relationship("WorkspaceMember", back_populates="permissions")





class WorkspaceDeleteLog(Base):
    __tablename__ = "workspace_delete_logs"

    id = Column(Integer, primary_key=True, index=True)
    workspace_id = Column(Integer, nullable=False, index=True)
    workspace_name = Column(String(100))
    deleted_by = Column(Integer, nullable=False)
    deleted_at = Column(DateTime, default=datetime.utcnow)


class MemberDeleteLog(Base):
    __tablename__ = "member_delete_logs"

    id = Column(Integer, primary_key=True, index=True)
    workspace_id = Column(Integer, ForeignKey(
        "workspaces.id", ondelete="CASCADE"), nullable=False)
    member_id = Column(Integer, nullable=False)
    username = Column(String(50))
    email = Column(String(100))
    deleted_by = Column(Integer, nullable=False)
    deleted_at = Column(DateTime, default=datetime.utcnow)
    

class WorkspaceMember(Base):
    __tablename__ = "workspace_members"

    id = Column(Integer, primary_key=True)
    workspace_id = Column(Integer, ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    role = Column(String(50))
    joined_at = Column(DateTime, default=datetime.utcnow)

    permissions = relationship(
        "MemberPermission",
        back_populates="member",
        cascade="all, delete-orphan"
    )

# -------------------------------------------------------
# ADD THIS to your app/models/workspace.py
# (or import it from here in your models __init__)
# -------------------------------------------------------

import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID


class WorkspaceJoinRequest(Base):
    __tablename__ = "workspace_join_requests"

    id = Column(Integer, primary_key=True, index=True)
    workspace_id = Column(Integer, ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    message = Column(Text, nullable=True)
    status = Column(
        SAEnum("pending", "approved", "rejected", name="joinrequeststatus"),
        nullable=False,
        default="pending",
        index=True,
    )
    requested_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))


# -------------------------------------------------------
# Alembic migration (run after adding the model above):
#
#   alembic revision --autogenerate -m "add workspace_join_requests"
#   alembic upgrade head
#
# Or raw SQL if you prefer:
#
# CREATE TYPE joinrequeststatus AS ENUM ('pending', 'approved', 'rejected');
#
# CREATE TABLE workspace_join_requests (
#     id              SERIAL PRIMARY KEY,
#     workspace_id    INTEGER NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
#     user_id         UUID    NOT NULL REFERENCES users(id)      ON DELETE CASCADE,
#     message         TEXT,
#     status          joinrequeststatus NOT NULL DEFAULT 'pending',
#     requested_at    TIMESTAMPTZ NOT NULL DEFAULT now()
# );
#
# CREATE INDEX idx_wjr_workspace_status ON workspace_join_requests (workspace_id, status);
# -------------------------------------------------------
