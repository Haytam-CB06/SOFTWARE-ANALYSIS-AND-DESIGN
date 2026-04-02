"""add image_url to workspaces

Revision ID: b13f0a2616fd
Revises: 9b0d1f3c2a11
Create Date: 2026-03-06 15:08:33.746871

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'b13f0a2616fd'
down_revision: Union[str, Sequence[str], None] = '9b0d1f3c2a11'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('workspaces', sa.Column('image_url', sa.String(), nullable=True))
    op.create_index(
        op.f('ix_workspaces_parent_id'),
        'workspaces',
        ['parent_id'],
        unique=False
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_workspaces_parent_id'), table_name='workspaces')
    op.drop_column('workspaces', 'image_url')