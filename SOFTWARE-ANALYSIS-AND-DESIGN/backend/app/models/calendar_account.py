import uuid
from sqlalchemy import Column, Text
from sqlalchemy.dialects.postgresql import UUID
from app.models.base import Base


class CalendarAccount(Base):
    __tablename__ = "calendar_accounts"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False)
    provider = Column(Text, nullable=False)          # 'google' | 'microsoft'
    account_email = Column(Text, nullable=False)
    # reference/handle to secret store
    refresh_token_ref = Column(Text)
    scope = Column(Text)
    # 'active' | 'revoked' | 'error'
    status = Column(Text, nullable=False, default="active")
