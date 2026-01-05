from datetime import datetime

from sqlalchemy import Column, DateTime, Integer
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.types import JSON

from app.models.base import Base


class WorkspaceAutoGenerateConfig(Base):
    __tablename__ = "workspace_auto_generate_config"

    workspace_id = Column(Integer, primary_key=True, index=True)
    config = Column(JSON().with_variant(JSONB, "postgresql"), nullable=False, default=dict)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
