import uuid
from sqlalchemy import Column, Text, SmallInteger, Boolean, Numeric
from sqlalchemy.dialects.postgresql import UUID
from app.db.base import Base
from sqlalchemy import ForeignKey, Index
from sqlalchemy.orm import relationship


class Subject(Base):
    __tablename__ = "subjects"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey(
        "users.id", ondelete="CASCADE"), nullable=False)
    title = Column(Text, nullable=False)
    code = Column(Text)
    difficulty = Column(SmallInteger)   # 1..5
    target_grade = Column(Text)
    credit_weight = Column(Numeric(4, 2))
    is_active = Column(Boolean, nullable=False, default=True)

    user = relationship("User", back_populates="subjects")
    class_meetings = relationship(
        "ClassMeeting", back_populates="subject", cascade="all, delete")

    __table_args__ = (
        Index('ix_subjects_user_id', 'user_id'),
        Index('ix_subjects_user_id_is_active', 'user_id', 'is_active'),
    )
