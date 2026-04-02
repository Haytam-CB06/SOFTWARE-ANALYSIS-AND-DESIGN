import uuid

from sqlalchemy import Column, ForeignKey, Index, SmallInteger, Text, Time
from sqlalchemy.dialects.postgresql import UUID

from app.models.base import Base


class UserBusyBlock(Base):
    """A weekly-pattern busy block provided by the user for auto-generation.

    Stored as (day_of_week, start_time, end_time) in backend convention
    (0=Sun..6=Sat).
    """

    __tablename__ = "user_busy_blocks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    title = Column(Text, nullable=False, default="Busy")
    day_of_week = Column(SmallInteger, nullable=False)  # 0=Sun..6=Sat
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)

    __table_args__ = (
        Index("ix_user_busy_blocks_user", "user_id"),
        Index("ix_user_busy_blocks_user_day", "user_id", "day_of_week"),
    )
