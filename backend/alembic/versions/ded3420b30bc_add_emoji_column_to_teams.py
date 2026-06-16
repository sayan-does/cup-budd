"""add_emoji_column_to_teams

Revision ID: ded3420b30bc
Revises: a1b2c3d4e5f6
Create Date: 2026-06-16 03:41:39.298913

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'ded3420b30bc'
down_revision = 'a1b2c3d4e5f6'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('teams', sa.Column('emoji', sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column('teams', 'emoji')