from sqlalchemy import Column, SmallInteger, Time
from sqlalchemy.dialects.postgresql import UUID
from app.db import Base


class Preferences(Base):
    __tablename__ = "preferences"
    user_id = Column(UUID(as_uuid=True), primary_key=True)
    default_session_minutes = Column(SmallInteger, nullable=False, default=50)
    daily_cap_minutes = Column(SmallInteger, nullable=False, default=240)
    weekly_cap_minutes = Column(SmallInteger, nullable=False, default=1200)
    quiet_hours_start = Column(Time)
    quiet_hours_end = Column(Time)

