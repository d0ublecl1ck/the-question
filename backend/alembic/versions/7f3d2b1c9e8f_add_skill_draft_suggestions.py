"""add skill draft suggestions

Revision ID: 7f3d2b1c9e8f
Revises: c1a2b3c4d5e6
Create Date: 2026-01-17 22:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel


# revision identifiers, used by Alembic.
revision: str = '7f3d2b1c9e8f'
down_revision: Union[str, Sequence[str], None] = 'c1a2b3c4d5e6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        'skill_draft_suggestions',
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.Column('id', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('session_id', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('message_id', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
        sa.Column('goal', sa.Text(), nullable=False),
        sa.Column('constraints', sa.Text(), nullable=True),
        sa.Column('reason', sa.String(), nullable=True),
        sa.Column('created_skill_id', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
        sa.Column(
            'status',
            sa.Enum('pending', 'accepted', 'rejected', name='skill_suggestion_status'),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('session_id', 'message_id'),
    )
    op.create_index(
        op.f('ix_skill_draft_suggestions_id'),
        'skill_draft_suggestions',
        ['id'],
        unique=False,
    )
    op.create_index(
        op.f('ix_skill_draft_suggestions_message_id'),
        'skill_draft_suggestions',
        ['message_id'],
        unique=False,
    )
    op.create_index(
        op.f('ix_skill_draft_suggestions_session_id'),
        'skill_draft_suggestions',
        ['session_id'],
        unique=False,
    )
    op.create_index(
        op.f('ix_skill_draft_suggestions_created_skill_id'),
        'skill_draft_suggestions',
        ['created_skill_id'],
        unique=False,
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_skill_draft_suggestions_created_skill_id'), table_name='skill_draft_suggestions')
    op.drop_index(op.f('ix_skill_draft_suggestions_session_id'), table_name='skill_draft_suggestions')
    op.drop_index(op.f('ix_skill_draft_suggestions_message_id'), table_name='skill_draft_suggestions')
    op.drop_index(op.f('ix_skill_draft_suggestions_id'), table_name='skill_draft_suggestions')
    op.drop_table('skill_draft_suggestions')
