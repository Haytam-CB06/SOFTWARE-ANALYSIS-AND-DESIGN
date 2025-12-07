"""create users

Revision ID: 2d1ec96c8578
Revises: d6a2ae1ee15b
Create Date: 2025-10-21 20:58:37.927154

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '2d1ec96c8578'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


from alembic import op
import sqlalchemy as sa

def upgrade() -> None:
    # users table already created by an earlier migration in this branch.
    # make this revision a no-op to avoid DuplicateTable errors.
    pass

def downgrade() -> None:
    # no-op counterpart (we don't drop users here because it wasn't created here)
    pass
