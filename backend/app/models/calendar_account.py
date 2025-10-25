import uuid
from sqlalchemy import Column, Text
from sqlalchemy.dialects.postgresql import UUID
from .base import Base

class CalendarAccount(Base):
    __tablename__ = "calendar_accounts"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False)
    provider = Column(Text, nullable=False)          # 'google' | 'microsoft'
    account_email = Column(Text, nullable=False)
    refresh_token_ref = Column(Text)                 # reference/handle to secret store
    scope = Column(Text)
    status = Column(Text, nullable=False, default="active")  # 'active' | 'revoked' | 'error'
