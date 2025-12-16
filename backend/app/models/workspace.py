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
    owner_id = Column(UUID(as_uuid=True), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow,onupdate=datetime.utcnow)





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