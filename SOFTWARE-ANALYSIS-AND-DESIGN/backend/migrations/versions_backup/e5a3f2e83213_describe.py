"""describe

Revision ID: e5a3f2e83213
Revises: d6a2ae1ee15b
Create Date: 2025-11-10 00:00:00

Make operations on users.gender idempotent so migration works
whether or not the column already exists.
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "e5a3f2e83213"
down_revision = "d6a2ae1ee15b"
branch_labels = None
depends_on = None


def upgrade():
    bind = op.get_bind()
    insp = sa.inspect(bind)

    # Current columns on users
    cols = {c["name"]: c for c in insp.get_columns("users")}

    # 👉 Adjust this type to match your model if needed
    # If you actually use an Enum or a different length, change it here.
    gender_type = sa.String(length=50)

    if "gender" not in cols:
        # Column doesn't exist yet — create it as NULLable so subsequent ALTERs are valid
        op.add_column(
            "users",
            sa.Column("gender", gender_type, nullable=True),
        )
        # If you previously stored gender in another column and renamed in ORM,
        # you could copy data here with an UPDATE ... SET ... FROM ... statement.
    else:
        # Column exists — ensure it is NULLable (this is what the original ALTER intended)
        existing_type = cols["gender"]["type"] if "gender" in cols else gender_type
        # existing_nullable can be True/False/None; we just make sure it's nullable=True.
        op.alter_column(
            "users",
            "gender",
            existing_type=existing_type or gender_type,
            nullable=True,
        )


def downgrade():
    # Safe-ish downgrade:
    # If we created the column here, drop it. If it pre-existed historically,
    # you might prefer to restore NOT NULL instead — customize as needed.
    bind = op.get_bind()
    insp = sa.inspect(bind)
    cols = {c["name"] for c in insp.get_columns("users")}

    if "gender" in cols:
        # If you want to *keep* the column but set NOT NULL on downgrade instead,
        # replace this with an alter_column making it NOT NULL.
        op.drop_column("users", "gender")
