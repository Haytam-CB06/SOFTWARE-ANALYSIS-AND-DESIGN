"""describe

Revision ID: d6a2ae1ee15b
Revises: ce0ee6b4ca4b
Create Date: 2025-11-10 00:00:00

This migration is made idempotent so it works whether or not
`users.password_hash` already exists.
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "d6a2ae1ee15b"
down_revision = "ce0ee6b4ca4b"
branch_labels = None
depends_on = None


def upgrade():
    bind = op.get_bind()
    insp = sa.inspect(bind)

    # Discover columns on the users table
    user_cols = {c["name"] for c in insp.get_columns("users")}

    # Adjust this to match your model's type/length if different
    password_hash_type = sa.String(length=255)

    if "password_hash" not in user_cols:
        # Column doesn't exist yet — create it as nullable so the later ALTER is valid
        op.add_column(
            "users",
            sa.Column("password_hash", password_hash_type, nullable=True),
        )
        # If you previously had a `password` column and just renamed in the ORM,
        # optionally copy values across once so you don't lose data:
        if "password" in user_cols:
            op.execute(
                """
                UPDATE users
                SET password_hash = password
                WHERE password_hash IS NULL
                """
            )
    else:
        # Column exists — ensure it is nullable as this migration intended (drop NOT NULL)
        op.alter_column(
            "users",
            "password_hash",
            existing_type=password_hash_type,
            nullable=True,
            existing_nullable=False,
        )

    # If you intended to DROP the old `password` column eventually, do it in a later,
    # explicit data-safe migration (after confirming data is in password_hash).


def downgrade():
    # Downgrade reverses the upgrade safely:
    bind = op.get_bind()
    insp = sa.inspect(bind)
    user_cols = {c["name"] for c in insp.get_columns("users")}

    # If you added the column here, drop it on downgrade.
    # If the column existed before this migration historically, you might prefer
    # to just restore NOT NULL instead of dropping it. Adjust as needed.
    if "password_hash" in user_cols:
        op.drop_column("users", "password_hash")
