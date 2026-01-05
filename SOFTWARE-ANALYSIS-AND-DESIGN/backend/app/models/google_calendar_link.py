import uuid
from sqlalchemy import Column, Text, DateTime, func
from sqlalchemy.dialects.postgresql import UUID

from app.models.base import Base


class GoogleCalendarLink(Base):
    """Stores Google OAuth credentials + export metadata per app user.

    This project currently creates tables via `Base.metadata.create_all()`.
    To avoid breaking existing SQLite DBs, we add a new table rather than
    altering existing ones.
    """

    __tablename__ = "google_calendar_links"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False, unique=True)

    # OAuth credentials as JSON string from `google.oauth2.credentials.Credentials.to_json()`
    credentials_json = Column(Text, nullable=False)

    # A dedicated calendar created by the app for exports (so overwrite is easy)
    calendar_id = Column(Text, nullable=True)

    # Last export marker (for UI prompts)
    last_export_at = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), default=func.now(), onupdate=func.now())
