"""add email type prefs to preferences

Revision ID: a1f3b7c2d9e0
Revises: 4c2f9e1a7d21
Create Date: 2025-12-31

"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'a1f3b7c2d9e0'
down_revision = '4c2f9e1a7d21'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('preferences', sa.Column('email_deadline_alerts_enabled', sa.Boolean(), nullable=False, server_default=sa.true()))
    op.add_column('preferences', sa.Column('email_achievement_alerts_enabled', sa.Boolean(), nullable=False, server_default=sa.true()))
    op.add_column('preferences', sa.Column('email_weekly_summary_enabled', sa.Boolean(), nullable=False, server_default=sa.true()))


def downgrade() -> None:
    op.drop_column('preferences', 'email_weekly_summary_enabled')
    op.drop_column('preferences', 'email_achievement_alerts_enabled')
    op.drop_column('preferences', 'email_deadline_alerts_enabled')
