from sqlalchemy import Column, SmallInteger, Time, Boolean
from sqlalchemy.dialects.postgresql import UUID
from app.models.base import Base


class Preferences(Base):
    __tablename__ = "preferences"
    user_id = Column(UUID(as_uuid=True), primary_key=True)
    default_session_minutes = Column(SmallInteger, nullable=False, default=50)
    daily_cap_minutes = Column(SmallInteger, nullable=False, default=240)
    weekly_cap_minutes = Column(SmallInteger, nullable=False, default=1200)
    quiet_hours_start = Column(Time)
    quiet_hours_end = Column(Time)

    # Notification preferences
    email_reminders_enabled = Column(Boolean, nullable=False, default=True)
    email_reminder_minutes_before = Column(SmallInteger, nullable=False, default=10)

    # Per-type email preferences (future-proof)
    email_deadline_alerts_enabled = Column(Boolean, nullable=False, default=True)
    email_achievement_alerts_enabled = Column(Boolean, nullable=False, default=True)
    email_weekly_summary_enabled = Column(Boolean, nullable=False, default=True)
