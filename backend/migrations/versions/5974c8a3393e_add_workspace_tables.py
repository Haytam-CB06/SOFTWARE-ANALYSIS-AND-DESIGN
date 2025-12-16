"""Add workspace tables

Revision ID: 5974c8a3393e
Revises: c789e351d9f6
Create Date: 2025-12-07 19:22:06.223882

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = '5974c8a3393e'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""

    # Create workspaces table
    op.create_table('workspaces',
                    sa.Column('id', sa.Integer(), nullable=False),
                    sa.Column('name', sa.String(length=100), nullable=False),
                    sa.Column('description', sa.Text(), nullable=True),
                    sa.Column('owner_id', postgresql.UUID(as_uuid=True), nullable=False),
                    sa.Column('created_at', sa.DateTime(), nullable=False),
                    sa.Column('updated_at', sa.DateTime(), nullable=False),
                    sa.PrimaryKeyConstraint('id')
                    )
    op.create_index('ix_workspaces_owner_id', 'workspaces', ['owner_id'])

    # Create workspace_members table
    op.create_table('workspace_members',
                    sa.Column('id', sa.Integer(), nullable=False),
                    sa.Column('workspace_id', sa.Integer(), nullable=False),
                    sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
                    sa.Column('username', sa.String(length=50), nullable=True),
                    sa.Column('email', sa.String(length=100), nullable=True),
                    sa.Column('role', sa.String(length=50), nullable=True),
                    sa.Column('joined_at', sa.DateTime(), nullable=True),
                    sa.ForeignKeyConstraint(
                        ['workspace_id'], ['workspaces.id'], ondelete='CASCADE'),
                    sa.ForeignKeyConstraint(
                        ['user_id'], ['users.id'], ondelete='CASCADE'),
                    sa.PrimaryKeyConstraint('id'),
                    sa.UniqueConstraint('workspace_id', 'user_id')
                    )
    op.create_index('ix_workspace_members_workspace_id',
                    'workspace_members', ['workspace_id'])
    op.create_index('ix_workspace_members_user_id',
                    'workspace_members', ['user_id'])
    op.create_index('ix_workspace_members_role', 'workspace_members', ['role'])

    # Create member_permissions table
    op.create_table('member_permissions',
                    sa.Column('id', sa.Integer(), nullable=False),
                    sa.Column('workspace_member_id',
                              sa.Integer(), nullable=False),
                    sa.Column('permission_name', sa.String(
                        length=50), nullable=False),
                    sa.Column('is_granted', sa.Boolean(), nullable=False),
                    sa.Column('created_at', sa.DateTime(), nullable=False),
                    sa.ForeignKeyConstraint(['workspace_member_id'], [
                        'workspace_members.id'], ondelete='CASCADE'),
                    sa.PrimaryKeyConstraint('id'),
                    sa.UniqueConstraint(
                        'workspace_member_id', 'permission_name')
                    )
    op.create_index('ix_member_permissions_workspace_member_id',
                    'member_permissions', ['workspace_member_id'])

    # Create messages table
    op.create_table('messages',
                    sa.Column('id', sa.Integer(), nullable=False),
                    sa.Column('workspace_id', sa.Integer(), nullable=False),
                    sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=True),
                    sa.Column('username', sa.String(length=50), nullable=True),
                    sa.Column('content', sa.Text(), nullable=False),
                    sa.Column('created_at', sa.DateTime(), nullable=False),
                    sa.Column('updated_at', sa.DateTime(), nullable=False),
                    sa.ForeignKeyConstraint(
                        ['workspace_id'], ['workspaces.id'], ondelete='CASCADE'),
                    sa.ForeignKeyConstraint(
                        ['user_id'], ['users.id'], ondelete='CASCADE'),
                    sa.PrimaryKeyConstraint('id')
                    )
    op.create_index('ix_messages_workspace_id', 'messages', ['workspace_id'])
    op.create_index('ix_messages_user_id', 'messages', ['user_id'])
    op.create_index('ix_messages_created_at', 'messages', ['created_at'])

    # Create workspace_delete_logs table
    op.create_table('workspace_delete_logs',
                    sa.Column('id', sa.Integer(), nullable=False),
                    sa.Column('workspace_id', sa.Integer(), nullable=False),
                    sa.Column('workspace_name', sa.String(
                        length=100), nullable=True),
                    sa.Column('deleted_by', sa.Integer(), nullable=False),
                    sa.Column('deleted_at', sa.DateTime(), nullable=False),
                    sa.Column('reason', sa.Text(), nullable=True),
                    sa.PrimaryKeyConstraint('id')
                    )

    # Create member_delete_logs table
    op.create_table('member_delete_logs',
                    sa.Column('id', sa.Integer(), nullable=False),
                    sa.Column('workspace_id', sa.Integer(), nullable=False),
                    sa.Column('member_id', sa.Integer(), nullable=False),
                    sa.Column('username', sa.String(length=50), nullable=True),
                    sa.Column('email', sa.String(length=100), nullable=True),
                    sa.Column('deleted_by', sa.Integer(), nullable=False),
                    sa.Column('deleted_at', sa.DateTime(), nullable=False),
                    sa.Column('reason', sa.Text(), nullable=True),
                    sa.ForeignKeyConstraint(
                        ['workspace_id'], ['workspaces.id'], ondelete='CASCADE'),
                    sa.ForeignKeyConstraint(
                        ['user_id'], ['users.id'], ondelete='CASCADE'),
                    sa.PrimaryKeyConstraint('id')
                    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table('member_delete_logs')
    op.drop_table('workspace_delete_logs')
    op.drop_table('messages')
    op.drop_table('member_permissions')
    op.drop_table('workspace_members')
    op.drop_table('workspaces')
    sa.Enum('admin', 'moderator', 'member', name='role_enum').drop(
        op.get_bind(), checkfirst=True)
