from sqlalchemy.orm import declarative_base, declared_attr
from sqlalchemy import Column, DateTime, text
from sqlalchemy.dialects.postgresql import UUID

Base = declarative_base()
target_metadata = Base.metadata
class UUIDPkMixin:
    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))

class TimestampMixin:
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=text("now()"))
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=text("now()"))

    @declared_attr
    def __mapper_args__(cls):
        # Let SQL do updated_at = now() on update; you can also add ORM events if preferred
        return {}

# Example:
# class User(UUIDPkMixin, TimestampMixin, Base):
#     __tablename__ = "users"
#     ...
