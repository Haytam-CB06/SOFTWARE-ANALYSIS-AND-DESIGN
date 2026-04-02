"""create email_verifications table

Revision ID: 937982fe442c
Revises: 6b9430b26942
Create Date: 2026-03-30 22:59:33.809289

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '937982fe442c'
down_revision: Union[str, Sequence[str], None] = '6b9430b26942'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    op.create_table(
        "email_verifications",
        sa.Column("email", sa.String(), nullable=False),
        sa.Column("code", sa.String(length=6), nullable=True),
        sa.Column("code_created_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("verified", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.PrimaryKeyConstraint("email"),
    )
    op.create_index(
        op.f("ix_email_verifications_email"),
        "email_verifications",
        ["email"],
        unique=False,
    )


def downgrade():
    op.drop_index(op.f("ix_email_verifications_email"), table_name="email_verifications")
    op.drop_table("email_verifications")