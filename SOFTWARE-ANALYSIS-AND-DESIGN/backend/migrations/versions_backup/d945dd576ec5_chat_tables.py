"""chat tables

Revision ID: d945dd576ec5
Revises: 1c0ef9a8326e
Create Date: 2025-12-01 19:07:20.869111

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd945dd576ec5'
down_revision: Union[str, Sequence[str], None] = '1c0ef9a8326e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


from sqlalchemy.dialects import postgresql

def upgrade() -> None:
    # Create chat_rooms table
    op.create_table(
        "chat_rooms",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(length=120), nullable=False, unique=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )

    # Create chat_members table
    op.create_table(
        "chat_members",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("room_id", postgresql.UUID(as_uuid=True),
                 sa.ForeignKey("chat_rooms.id", ondelete="CASCADE"), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True),
                 sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("role", sa.String(length=20), nullable=False, server_default="member"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )
    op.create_index(
        "ix_chat_members_room_user",
        "chat_members",
        ["room_id", "user_id"],
        unique=True,
    )

    # Create chat_messages table
    op.create_table(
        "chat_messages",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("room_id", postgresql.UUID(as_uuid=True),
                 sa.ForeignKey("chat_rooms.id", ondelete="CASCADE"), nullable=False),
        sa.Column("sender_id", postgresql.UUID(as_uuid=True),
                 sa.ForeignKey("users.id", ondelete="SET NULL")),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )


def downgrade() -> None:
    op.drop_table("chat_messages")
    op.drop_index("ix_chat_members_room_user", table_name="chat_members")
    op.drop_table("chat_members")
    op.drop_table("chat_rooms")
