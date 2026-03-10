"""add edited flag to workspace messages

Revision ID: 87fc7291f778
Revises: b13f0a2616fd
Create Date: 2026-03-10 12:19:09.726474

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '87fc7291f778'
down_revision: Union[str, Sequence[str], None] = 'b13f0a2616fd'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'workspace_messages',
        sa.Column('edited', sa.Boolean(), nullable=False, server_default=sa.false())
    )
    op.alter_column('workspace_messages', 'edited', server_default=None)


def downgrade() -> None:
    op.drop_column('workspace_messages', 'edited')