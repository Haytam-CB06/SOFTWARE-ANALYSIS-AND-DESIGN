import uuid
from sqlalchemy import Column, Text, SmallInteger, Boolean, Numeric
from sqlalchemy.dialects.postgresql import UUID
from .base import Base

class Subject(Base):
    __tablename__ = "subjects"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False)
    title = Column(Text, nullable=False)
    code = Column(Text)
    difficulty = Column(SmallInteger)   # 1..5
    target_grade = Column(Text)
    credit_weight = Column(Numeric(4, 2))
    is_active = Column(Boolean, nullable=False, default=True)
