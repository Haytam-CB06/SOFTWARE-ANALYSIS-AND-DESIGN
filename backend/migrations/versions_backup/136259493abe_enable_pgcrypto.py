"""enable pgcrypto

Revision ID: 136259493abe
Revises: 7d058483b867
Create Date: 2025-10-24 15:42:49.347221

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '136259493abe'
down_revision: Union[str, Sequence[str], None] = '7d058483b867'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS pgcrypto")

def downgrade() -> None:
    op.execute("DROP EXTENSION IF EXISTS pgcrypto")
