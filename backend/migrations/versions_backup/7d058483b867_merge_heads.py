"""merge heads

Revision ID: 7d058483b867
Revises: ff4d8844019d
Create Date: 2025-10-24 15:38:33.970673

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '7d058483b867'
down_revision: Union[str, Sequence[str], None] = 'ff4d8844019d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
