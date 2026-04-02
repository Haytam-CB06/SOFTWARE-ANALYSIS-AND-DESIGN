import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.types import JSON

from app.models.base import Base


class WorkspaceWeekStudySchedule(Base):
    """Per-workspace, per-week study timetable sessions.

    This mirrors UserWeekStudySchedule, but is scoped to a workspace so that
    all members can view the same timetable across browsers/devices.
    """

    __tablename__ = "workspace_week_study_schedules"
    __table_args__ = (
        UniqueConstraint("workspace_id", "week_id", name="uq_workspace_week_study_schedule"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workspace_id = Column(Integer, ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False)
    # week identifier used by the frontend (e.g. "2025-W45"). Treated as an opaque key.
    week_id = Column(Text, nullable=False)

    # Store the full session objects from the UI (type/color/deadline/etc.)
    sessions = Column(JSON, nullable=False, default=list)

    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.utcnow())
    updated_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.utcnow(),
        onupdate=lambda: datetime.utcnow(),
    )
