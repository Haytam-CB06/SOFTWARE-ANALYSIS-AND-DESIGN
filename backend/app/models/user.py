import uuid
from sqlalchemy import Column, Text
from sqlalchemy.dialects.postgresql import UUID
from .base import Base

class User(Base):
    __tablename__ = "users"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(Text, nullable=False, unique=True)
    full_name = Column(Text)
    timezone = Column(Text, nullable=False, default="UTC")
