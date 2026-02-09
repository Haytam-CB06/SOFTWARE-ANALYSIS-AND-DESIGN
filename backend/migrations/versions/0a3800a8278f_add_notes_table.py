"""add notes table

Revision ID: 0a3800a8278f
Revises: ed487c089d91
Create Date: 2026-02-09 07:10:07.614848

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0a3800a8278f'
down_revision: Union[str, Sequence[str], None] = 'ed487c089d91'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    op.create_table(
        'notes',
        sa.Column('id', sa.String(), primary_key=True),
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('title', sa.String(length=200), nullable=False, server_default=''),
        sa.Column('content', sa.Text(), nullable=False, server_default=''),
        sa.Column('entity_type', sa.String(), nullable=True),
        sa.Column('entity_id', sa.String(), nullable=True),
        sa.Column('tags', sa.String(), nullable=False, server_default=''),
        sa.Column('pinned', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('archived', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
    )

    op.create_index('ix_notes_user_id', 'notes', ['user_id'])
    op.create_index('ix_notes_entity_type', 'notes', ['entity_type'])
    op.create_index('ix_notes_entity_id', 'notes', ['entity_id'])
    op.create_index('ix_notes_user_entity', 'notes', ['user_id','entity_type','entity_id'])
    op.create_index('ix_notes_user_updated', 'notes', ['user_id','updated_at'])


def downgrade():
    op.drop_index('ix_notes_user_updated', table_name='notes')
    op.drop_index('ix_notes_user_entity', table_name='notes')
    op.drop_index('ix_notes_entity_id', table_name='notes')
    op.drop_index('ix_notes_entity_type', table_name='notes')
    op.drop_index('ix_notes_user_id', table_name='notes')
    op.drop_table('notes')