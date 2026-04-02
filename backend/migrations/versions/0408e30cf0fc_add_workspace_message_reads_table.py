"""add workspace_message_reads table

Revision ID: 0408e30cf0fc
Revises: 87fc7291f778
Create Date: 2026-03-18 14:19:28.713864

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0408e30cf0fc'
down_revision: Union[str, Sequence[str], None] = '87fc7291f778'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
