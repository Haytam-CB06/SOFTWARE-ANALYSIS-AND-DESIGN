from sqlalchemy import Column, String, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
import uuid

from app.models.base import Base  # or wherever Base is
from sqlalchemy.orm import relationship


class OAuthAccount(Base):
    __tablename__ = "oauth_accounts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    provider = Column(String, nullable=False)
    provider_user_id = Column(String, nullable=False)
    email = Column(String, nullable=True)

    user = relationship("User", back_populates="oauth_accounts")
