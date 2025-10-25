"""merge heads

Revision ID: ff4d8844019d
Revises: 2d1ec96c8578, 3a1389b86126
Create Date: 2025-10-24 15:28:46.124731

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ff4d8844019d'
down_revision: Union[str, Sequence[str], None] = ('2d1ec96c8578', '3a1389b86126')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
