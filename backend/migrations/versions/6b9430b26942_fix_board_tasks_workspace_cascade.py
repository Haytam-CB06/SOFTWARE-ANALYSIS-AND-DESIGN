"""fix board_tasks workspace cascade

Revision ID: 6b9430b26942
Revises: 5623fcf5da6e
Create Date: 2026-03-26 16:06:36.873596

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '6b9430b26942'
down_revision: Union[str, Sequence[str], None] = '5623fcf5da6e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    op.drop_constraint(
        "board_tasks_workspace_id_fkey",
        "board_tasks",
        type_="foreignkey"
    )
    op.create_foreign_key(
        "board_tasks_workspace_id_fkey",
        "board_tasks",
        "workspaces",
        ["workspace_id"],
        ["id"],
        ondelete="CASCADE"
    )


def downgrade():
    op.drop_constraint(
        "board_tasks_workspace_id_fkey",
        "board_tasks",
        type_="foreignkey"
    )
    op.create_foreign_key(
        "board_tasks_workspace_id_fkey",
        "board_tasks",
        "workspaces",
        ["workspace_id"],
        ["id"]
    )