import uuid

from sqlalchemy import Boolean, Column, ForeignKey, Time
from sqlalchemy.dialects.postgresql import UUID

from app.models.base import Base


class StudyWindowSetting(Base):
    """User-level settings for the Auto Generate study window.

    This is stored as a weekly template (not date-bound). The frontend uses
    these values to decide what hours can be filled with generated study
    sessions.
    """

    __tablename__ = "study_window_settings"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)

    weekday_start = Column(Time, nullable=False)
    weekday_end = Column(Time, nullable=False)

    include_weekends = Column(Boolean, nullable=False, default=False)
    weekend_same_as_weekday = Column(Boolean, nullable=False, default=True)
    weekend_start = Column(Time)
    weekend_end = Column(Time)
