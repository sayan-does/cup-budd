from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import GeneratedNotification, NotificationPreference, User

EVENT_TYPE_MAP = {
    "goal": ("goal_alert", "goal_alerts"),
    "own_goal": ("goal_alert", "goal_alerts"),
    "match_finished": ("result_summary", "result_summaries"),
    "match_reminder": ("match_reminder", "match_reminders"),
}


async def evaluate_event(
    db: AsyncSession,
    event_type: str,
    team_id: int,
    fixture_id: int,
    reminder_offset: str | None = None,
) -> dict:
    notification_info = EVENT_TYPE_MAP.get(event_type)
    if notification_info is None:
        return {
            "should_notify": False,
            "notification_type": None,
            "affected_users": [],
            "reuse_notification_id": None,
        }

    notification_type, preference_field = notification_info

    existing = await _check_existing_notification(
        db, fixture_id, event_type, notification_type, reminder_offset
    )
    if existing:
        affected_users = await _get_affected_users(
            db, team_id, notification_type, preference_field
        )
        if event_type != "match_reminder":
            affected_users = [
                u for u in affected_users if u.push_endpoint is not None
            ]
        return {
            "should_notify": True,
            "notification_type": notification_type,
            "affected_users": affected_users,
            "reuse_notification_id": existing.id,
        }

    return {
        "should_notify": True,
        "notification_type": notification_type,
        "affected_users": [],
        "reuse_notification_id": None,
    }


async def get_users_for_team(
    db: AsyncSession, team_id: int
) -> list[User]:
    stmt = select(User).where(
        and_(
            User.favorite_team_id == team_id,
            User.push_endpoint.isnot(None),
            User.onboarding_complete.is_(True),
        )
    )
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def get_users_for_reminder(
    db: AsyncSession, home_team_id: int, away_team_id: int
) -> list[User]:
    stmt = select(User).where(
        and_(
            User.favorite_team_id.in_([home_team_id, away_team_id]),
            User.push_endpoint.isnot(None),
            User.onboarding_complete.is_(True),
        )
    )
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def _check_existing_notification(
    db: AsyncSession,
    fixture_id: int,
    event_type: str,
    notification_type: str,
    reminder_offset: str | None,
) -> GeneratedNotification | None:
    stmt = select(GeneratedNotification).where(
        and_(
            GeneratedNotification.fixture_id == fixture_id,
            GeneratedNotification.event_type == event_type,
            GeneratedNotification.notification_type == notification_type,
            GeneratedNotification.reminder_offset == reminder_offset,
        )
    )
    result = await db.execute(stmt)
    return result.scalar_one_or_none()


async def _get_affected_users(
    db: AsyncSession,
    team_id: int,
    notification_type: str,
    preference_field: str,
) -> list[User]:
    stmt = (
        select(User)
        .join(NotificationPreference, User.id == NotificationPreference.user_id)
        .where(
            and_(
                User.favorite_team_id == team_id,
                getattr(NotificationPreference, preference_field).is_(True),
            )
        )
    )
    result = await db.execute(stmt)
    return list(result.scalars().all())
