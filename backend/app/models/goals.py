import uuid
from sqlalchemy import Column, ForeignKey, Date, Numeric, SmallInteger, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from app.models.base import Base


class Goal(Base):                         # <-- singular
    __tablename__ = "goals"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey(
        "users.id", ondelete="CASCADE"), nullable=False)
    subject_id = Column(UUID(as_uuid=True), ForeignKey(
        "subjects.id", ondelete="CASCADE"))
    period_start = Column(Date, nullable=False)
    period_end = Column(Date, nullable=False)
    target_hours = Column(Numeric(6, 2), nullable=False)
    weight = Column(SmallInteger)   # 1..5

    __table_args__ = (
        UniqueConstraint("user_id", "subject_id", "period_start",
                         "period_end", name="uq_goal_period"),
    )

