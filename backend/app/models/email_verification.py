from sqlalchemy import Column, String, DateTime, Boolean
from app.models.base import Base


class EmailVerification(Base):
    __tablename__ = "email_verifications"

    email = Column(String, primary_key=True, index=True)
    code = Column(String, nullable=True)
    code_created_at = Column(DateTime(timezone=True), nullable=True)
    verified = Column(Boolean, default=False, nullable=False)