import logging

from datetime import datetime, timedelta

from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import Fixture, ReminderDispatch, User
from app.db.session import async_session_maker
from app.services.kickoff import now_ist
from app.services.notification_templates import render_match_reminder
from app.services.push_delivery import create_and_fan_out

logger = logging.getLogger(__name__)


async def run_reminder_check(db: AsyncSession | None = None, now: datetime | None = None) -> None:
    try:
        if db is None:
            async with async_session_maker() as session:
                await _check(session, now or now_ist())
        else:
            await _check(db, now or now_ist())
    except Exception as exc:
        logger.warning("Reminder check skipped (DB unavailable): %s", exc)


async def _check(db: AsyncSession, now: datetime) -> None:
    for offset_str, delta_minutes in [("1h", 60), ("15m", 15)]:
        await _process_offset(db, now, offset_str, delta_minutes)


async def _process_offset(db: AsyncSession, now: datetime, offset_str: str, delta_minutes: int) -> None:
    lower = now + timedelta(minutes=delta_minutes - 1)
    upper = now + timedelta(minutes=delta_minutes + 1)

    stmt = (
        select(Fixture)
        .where(
            and_(
                Fixture.status == "scheduled",
                Fixture.kickoff_ist >= lower,
                Fixture.kickoff_ist <= upper,
            )
        )
    )
    result = await db.execute(stmt)
    fixtures = list(result.scalars().all())

    for fixture in fixtures:
        already = await _already_dispatched(db, fixture.id, offset_str)
        if already:
            continue
        await _dispatch_reminder(db, fixture, offset_str)


async def _already_dispatched(db: AsyncSession, fixture_id: int, offset: str) -> bool:
    stmt = select(ReminderDispatch).where(
        and_(
            ReminderDispatch.fixture_id == fixture_id,
            ReminderDispatch.reminder_offset == offset,
        )
    )
    result = await db.execute(stmt)
    return result.first() is not None


async def _dispatch_reminder(db: AsyncSession, fixture: Fixture, offset_str: str) -> None:
    from app.db.models import Team

    home_stmt = select(Team).where(Team.id == fixture.home_team_id)
    away_stmt = select(Team).where(Team.id == fixture.away_team_id)
    home_result = await db.execute(home_stmt)
    away_result = await db.execute(away_stmt)
    home_team = home_result.scalar_one_or_none()
    away_team = away_result.scalar_one_or_none()
    if not home_team or not away_team:
        return

    home_users = await _get_users_for_team(db, fixture.home_team_id)
    away_users = await _get_users_for_team(db, fixture.away_team_id)
    all_users = list({u.id: u for u in home_users + away_users}.values())
    if not all_users:
        return

    group = fixture.group or ""

    home_text = await render_match_reminder(
        team_name=home_team.name,
        opponent_name=away_team.name,
        group=group,
        reminder_offset=offset_str,
        kickoff_local=fixture.kickoff_ist.strftime("%H:%M"),
    )

    for user in all_users:
        if user.favorite_team_id == fixture.home_team_id:
            text = home_text
        else:
            text = await render_match_reminder(
                team_name=away_team.name,
                opponent_name=home_team.name,
                group=group,
                reminder_offset=offset_str,
                kickoff_local=fixture.kickoff_ist.strftime("%H:%M"),
            )
        await create_and_fan_out(
            db=db,
            fixture_id=fixture.id,
            event_type="match_reminder",
            notification_type="match_reminder",
            reminder_offset=offset_str,
            title=text["title"],
            body=text["body"],
            users=[user],
        )

    dispatch = ReminderDispatch(fixture_id=fixture.id, reminder_offset=offset_str)
    db.add(dispatch)
    await db.commit()


async def _get_users_for_team(db: AsyncSession, team_id: int) -> list[User]:
    stmt = select(User).where(
        and_(
            User.favorite_team_id == team_id,
            User.push_endpoint.isnot(None),
            User.onboarding_complete.is_(True),
        )
    )
    result = await db.execute(stmt)
    return list(result.scalars().all())
