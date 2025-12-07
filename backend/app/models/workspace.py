from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, Enum, ForeignKey, UniqueConstraint, Boolean
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime
import enum

Base = declarative_base()


class RoleEnum(enum.Enum):
    admin = "admin"
    moderator = "moderator"
    member = "member"


class Workspace(Base):
    __tablename__ = "workspaces"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    owner_id = Column(Integer, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow,
                        onupdate=datetime.utcnow)


class WorkspaceMember(Base):
    __tablename__ = "workspace_members"

    id = Column(Integer, primary_key=True, index=True)
    workspace_id = Column(Integer, ForeignKey(
        "workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, nullable=False, index=True)
    username = Column(String(50))
    email = Column(String(100))
    role = Column(Enum(RoleEnum), default=RoleEnum.member,
                  nullable=False, index=True)
    joined_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (UniqueConstraint(
        'workspace_id', 'user_id', name='uq_workspace_user'),)


class MemberPermission(Base):
    __tablename__ = "member_permissions"

    id = Column(Integer, primary_key=True, index=True)
    workspace_member_id = Column(Integer, ForeignKey(
        "workspace_members.id", ondelete="CASCADE"), nullable=False, index=True)
    permission_name = Column(String(50), nullable=False)
    is_granted = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (UniqueConstraint('workspace_member_id',
                      'permission_name', name='uq_member_permission'),)


class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    workspace_id = Column(Integer, ForeignKey(
        "workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, nullable=True, index=True)
    username = Column(String(50))
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow,
                        onupdate=datetime.utcnow)


class WorkspaceDeleteLog(Base):
    __tablename__ = "workspace_delete_logs"

    id = Column(Integer, primary_key=True, index=True)
    workspace_id = Column(Integer, nullable=False, index=True)
    workspace_name = Column(String(100))
    deleted_by = Column(Integer, nullable=False)
    deleted_at = Column(DateTime, default=datetime.utcnow)
    reason = Column(Text, nullable=True)


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
    reason = Column(Text, nullable=True)
