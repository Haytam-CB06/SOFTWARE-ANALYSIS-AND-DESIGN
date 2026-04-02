"""remove archived default

Revision ID: 5623fcf5da6e
Revises: af7ad2e86964
Create Date: 2026-03-25 18:35:26.986127

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '5623fcf5da6e'
down_revision: Union[str, Sequence[str], None] = 'af7ad2e86964'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
