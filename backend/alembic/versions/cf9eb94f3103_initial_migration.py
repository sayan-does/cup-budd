"""Initial migration

Revision ID: cf9eb94f3103
Revises: 
Create Date: 2026-06-12 03:47:30.055470

"""
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision = "cf9eb94f3103"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()
    is_postgres = conn.dialect.name == "postgresql"
    if is_postgres:
        op.execute("CREATE EXTENSION IF NOT EXISTS pgcrypto")

    op.create_table(
        "teams",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("external_id", sa.Text(), nullable=False),
        sa.Column("name", sa.Text(), nullable=False),
        sa.Column("code", sa.Text(), nullable=True),
        sa.Column("group", sa.Text(), nullable=True),
        sa.Column("logo_url", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("external_id"),
    )

    op.create_table(
        "users",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("email", sa.Text(), nullable=False),
        sa.Column("name", sa.Text(), nullable=True),
        sa.Column("favorite_team_id", sa.Integer(), nullable=True),
        sa.Column("timezone", sa.Text(), nullable=False, server_default="UTC"),
        sa.Column("push_endpoint", sa.Text(), nullable=True),
        sa.Column("push_p256dh", sa.Text(), nullable=True),
        sa.Column("push_auth", sa.Text(), nullable=True),
        sa.Column("onboarding_complete", sa.Boolean(), nullable=False, server_default=sa.text("FALSE")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("email"),
        sa.ForeignKeyConstraint(["favorite_team_id"], ["teams.id"], ),
    )
    op.create_index("idx_users_favorite_team", "users", ["favorite_team_id"])
    if is_postgres:
        op.create_index("idx_users_push_endpoint", "users", ["push_endpoint"],
                        postgresql_where=sa.text("push_endpoint IS NOT NULL"))

    op.create_table(
        "notification_preferences",
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("match_reminders", sa.Boolean(), nullable=False, server_default=sa.text("TRUE")),
        sa.Column("goal_alerts", sa.Boolean(), nullable=False, server_default=sa.text("TRUE")),
        sa.Column("result_summaries", sa.Boolean(), nullable=False, server_default=sa.text("TRUE")),
        sa.Column("qualification_alerts", sa.Boolean(), nullable=False, server_default=sa.text("TRUE")),
        sa.Column("daily_digest", sa.Boolean(), nullable=False, server_default=sa.text("TRUE")),
        sa.PrimaryKeyConstraint("user_id"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
    )

    op.create_table(
        "fixtures",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("external_id", sa.Text(), nullable=False),
        sa.Column("home_team_id", sa.Integer(), nullable=False),
        sa.Column("away_team_id", sa.Integer(), nullable=False),
        sa.Column("kickoff_utc", sa.DateTime(timezone=True), nullable=False),
        sa.Column("status", sa.Text(), nullable=False, server_default="scheduled"),
        sa.Column("home_score", sa.Integer(), nullable=True),
        sa.Column("away_score", sa.Integer(), nullable=True),
        sa.Column("stage", sa.Text(), nullable=True),
        sa.Column("round_code", sa.Text(), nullable=True),
        sa.Column("location", sa.Text(), nullable=True),
        sa.Column("group", sa.Text(), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("external_id"),
        sa.ForeignKeyConstraint(["home_team_id"], ["teams.id"], ),
        sa.ForeignKeyConstraint(["away_team_id"], ["teams.id"], ),
    )
    op.create_index("idx_fixtures_status", "fixtures", ["status"])
    op.create_index("idx_fixtures_kickoff", "fixtures", ["kickoff_utc"])
    op.create_index("idx_fixtures_teams", "fixtures", ["home_team_id", "away_team_id"])

    op.create_table(
        "match_events",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("fixture_id", sa.Integer(), nullable=False),
        sa.Column("external_id", sa.Text(), nullable=False),
        sa.Column("event_type", sa.Text(), nullable=False),
        sa.Column("team_id", sa.Integer(), nullable=True),
        sa.Column("minute", sa.Integer(), nullable=True),
        sa.Column("payload", sa.JSON(), nullable=False, server_default="{}"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("external_id"),
        sa.ForeignKeyConstraint(["fixture_id"], ["fixtures.id"], ),
        sa.ForeignKeyConstraint(["team_id"], ["teams.id"], ),
    )
    op.create_index("idx_match_events_fixture", "match_events", ["fixture_id"])

    op.create_table(
        "generated_notifications",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("fixture_id", sa.Integer(), nullable=True),
        sa.Column("event_type", sa.Text(), nullable=False),
        sa.Column("notification_type", sa.Text(), nullable=False),
        sa.Column("reminder_offset", sa.Text(), nullable=True),
        sa.Column("title", sa.Text(), nullable=False),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("generated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["fixture_id"], ["fixtures.id"], ),
        sa.UniqueConstraint("fixture_id", "event_type", "notification_type", "reminder_offset",
                            name="uq_generated_notifications"),
    )

    op.create_table(
        "user_notifications",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("generated_notification_id", sa.Integer(), nullable=False),
        sa.Column("status", sa.Text(), nullable=False, server_default="pending"),
        sa.Column("sent_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["generated_notification_id"], ["generated_notifications.id"], ),
    )
    op.create_index("idx_user_notifications_user", "user_notifications", ["user_id"])
    op.create_index("idx_user_notifications_status", "user_notifications", ["status"])

    op.create_table(
        "reminder_dispatches",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("fixture_id", sa.Integer(), nullable=False),
        sa.Column("reminder_offset", sa.Text(), nullable=False),
        sa.Column("dispatched_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["fixture_id"], ["fixtures.id"], ),
        sa.UniqueConstraint("fixture_id", "reminder_offset", name="uq_reminder_dispatches"),
    )


def downgrade() -> None:
    op.drop_table("reminder_dispatches")
    op.drop_table("user_notifications")
    op.drop_table("generated_notifications")
    op.drop_table("match_events")
    op.drop_table("fixtures")
    op.drop_table("notification_preferences")
    op.drop_table("users")
    op.drop_table("teams")
