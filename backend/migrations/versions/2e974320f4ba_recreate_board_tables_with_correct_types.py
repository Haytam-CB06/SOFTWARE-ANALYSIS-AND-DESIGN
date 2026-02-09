"""recreate board tables with correct types

Revision ID: 2e974320f4ba
Revises: 015b5be8406f
Create Date: 2026-02-05 23:10:13.741778

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "2e974320f4ba"
down_revision = "015b5be8406f"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Drop in correct order (comments depends on tasks)
    op.execute("DROP TABLE IF EXISTS board_comments CASCADE;")
    op.execute("DROP TABLE IF EXISTS board_tasks CASCADE;")

    # Ensure UUID generator exists
    op.execute("CREATE EXTENSION IF NOT EXISTS pgcrypto;")

    op.create_table(
        "board_tasks",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("workspace_id", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("description", sa.Text(), nullable=False, server_default=""),
        sa.Column("status", sa.String(length=50), nullable=False, server_default="todo"),
        sa.Column("priority", sa.String(length=50), nullable=False, server_default="medium"),
        sa.Column("assignee_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("due_date", sa.DateTime(), nullable=True),
        sa.Column("labels", postgresql.ARRAY(sa.String()), nullable=False, server_default=sa.text("'{}'")),
        sa.Column("created_by", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
        sa.Column("attachments_count", sa.Integer(), nullable=False, server_default="0"),
        sa.ForeignKeyConstraint(["workspace_id"], ["workspaces.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["assignee_id"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["created_by"], ["users.id"], ondelete="SET NULL"),
    )

    op.create_table(
        "board_comments",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("task_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_name", sa.String(length=200), nullable=False),
        sa.Column("text", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["task_id"], ["board_tasks.id"], ondelete="CASCADE"),
    )


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS board_comments CASCADE;")
    op.execute("DROP TABLE IF EXISTS board_tasks CASCADE;")