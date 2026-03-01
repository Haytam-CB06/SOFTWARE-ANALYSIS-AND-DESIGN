"""add share link fields to workspaces

Revision ID: 9b0d1f3c2a11
Revises: 1e52a4a2fb12
Create Date: 2026-02-28

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "9b0d1f3c2a11"
down_revision: Union[str, Sequence[str], None] = "1e52a4a2fb12"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("workspaces", sa.Column("share_link_enabled", sa.Boolean(), nullable=False, server_default=sa.false()))
    op.add_column("workspaces", sa.Column("share_link_version", sa.Integer(), nullable=False, server_default="1"))


def downgrade() -> None:
    op.drop_column("workspaces", "share_link_version")
    op.drop_column("workspaces", "share_link_enabled")