from sqlalchemy import Column, String, Boolean, TIMESTAMP
from sqlalchemy.sql import func
import uuid
from .base import Base  # your Base import

class PasswordReset(Base):
    __tablename__ = "password_resets"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, nullable=False)
    code = Column(String, nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    expires_at = Column(TIMESTAMP(timezone=True), nullable=True)
    used = Column(Boolean, default=False)