"""add achievements tables

Revision ID: 4c2f9e1a7d21
Revises: 3b2f8c4a1d90
Create Date: 2025-12-31

"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '4c2f9e1a7d21'
down_revision = '3b2f8c4a1d90'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'achievements',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column('code', sa.Text(), nullable=False, unique=True),
        sa.Column('title', sa.Text(), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('points', sa.SmallInteger(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )

    op.create_table(
        'user_achievements',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('achievement_code', sa.Text(), sa.ForeignKey('achievements.code', ondelete='CASCADE'), nullable=False),
        sa.Column('unlocked_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.UniqueConstraint('user_id', 'achievement_code', name='uq_user_achievement'),
    )


def downgrade():
    op.drop_table('user_achievements')
    op.drop_table('achievements')
