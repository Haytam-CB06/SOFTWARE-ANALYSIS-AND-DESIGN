import enum
from datetime import datetime

from sqlalchemy import Column, DateTime, Enum, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID

from app.models.base import Base


class WorkspaceSessionStatus(str, enum.Enum):
    planned = "planned"
    completed = "completed"
    missed = "missed"
    skipped = "skipped"


class WorkspaceSessionStatusLog(Base):
    """Admin tracking of study-session execution inside a workspace.

    This is separate from individual user StudySession.
    It's a lightweight status map keyed by (workspace_id, week_id, calendar_session_id).
    """

    __tablename__ = "workspace_session_status_logs"

    id = Column(Integer, primary_key=True, index=True)

    workspace_id = Column(Integer, ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    week_id = Column(String(20), nullable=False, index=True)
    calendar_session_id = Column(String(128), nullable=False, index=True)

    status = Column(Enum(WorkspaceSessionStatus), nullable=False, default=WorkspaceSessionStatus.planned)

    marked_by_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint("workspace_id", "week_id", "calendar_session_id", name="uq_ws_week_cal_session"),
    )
