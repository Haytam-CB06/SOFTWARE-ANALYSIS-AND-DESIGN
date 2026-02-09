"""add board comments relationship

Revision ID: 015b5be8406f
Revises: d2dcc20f61bb
Create Date: 2026-02-05 23:02:17.255064

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '015b5be8406f'
down_revision: Union[str, Sequence[str], None] = 'd2dcc20f61bb'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ORM relationship only (no DB change needed)
    pass

def downgrade() -> None:
    pass