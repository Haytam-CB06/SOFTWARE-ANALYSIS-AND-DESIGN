"""merge heads

Revision ID: 78a90a053624
Revises: d945dd576ec5
Create Date: 2025-12-09 10:56:30.506429

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '78a90a053624'
down_revision: Union[str, Sequence[str], None] = '5974c8a3393e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
