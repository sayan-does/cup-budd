"""rename kickoff_utc to kickoff_ist

Revision ID: a1b2c3d4e5f6
Revises: cf9eb94f3103
Create Date: 2026-06-14 12:00:00.000000

"""
import sqlalchemy as sa

from alembic import op

revision = "a1b2c3d4e5f6"
down_revision = "cf9eb94f3103"
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()
    is_postgres = conn.dialect.name == "postgresql"
    is_sqlite = conn.dialect.name == "sqlite"

    if is_sqlite:
        op.execute("ALTER TABLE fixtures RENAME COLUMN kickoff_utc TO kickoff_ist")
        return

    with op.batch_alter_table("fixtures", schema=None) as batch_op:
        batch_op.alter_column(
            "kickoff_utc",
            new_column_name="kickoff_ist",
            existing_type=sa.DateTime(timezone=True),
            existing_nullable=False,
        )
        batch_op.drop_index("idx_fixtures_kickoff")
        batch_op.create_index("idx_fixtures_kickoff_ist", ["kickoff_ist"])

    if is_postgres:
        op.execute(
            """
            UPDATE fixtures
            SET kickoff_ist = (
                (kickoff_ist AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Kolkata'
            )
            """
        )


def downgrade() -> None:
    conn = op.get_bind()
    is_postgres = conn.dialect.name == "postgresql"
    is_sqlite = conn.dialect.name == "sqlite"

    if is_sqlite:
        op.execute("ALTER TABLE fixtures RENAME COLUMN kickoff_ist TO kickoff_utc")
        return

    if is_postgres:
        op.execute(
            """
            UPDATE fixtures
            SET kickoff_ist = (
                (kickoff_ist AT TIME ZONE 'Asia/Kolkata') AT TIME ZONE 'UTC'
            )
            """
        )

    with op.batch_alter_table("fixtures", schema=None) as batch_op:
        batch_op.drop_index("idx_fixtures_kickoff_ist")
        batch_op.alter_column(
            "kickoff_ist",
            new_column_name="kickoff_utc",
            existing_type=sa.DateTime(timezone=True),
            existing_nullable=False,
        )
        batch_op.create_index("idx_fixtures_kickoff", ["kickoff_utc"])
