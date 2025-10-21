import uuid
from sqlalchemy import Column, Text
from sqlalchemy.dialects.postgresql import UUID, CITEXT
from .base import Base

# If your local Postgres doesn't have CITEXT extension, use Text for now.
# You can switch to CITEXT later.
class User(Base):
    __tablename__ = "users"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(Text, nullable=False, unique=True)
    full_name = Column(Text)
    timezone = Column(Text, nullable=False, default="UTC")

