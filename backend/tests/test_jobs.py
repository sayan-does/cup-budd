from datetime import UTC, datetime, timedelta
from unittest.mock import AsyncMock, patch

import pytest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.db.models import Base, Fixture, ReminderDispatch, Team
from app.services.kickoff import IST

TEST_DATABASE_URL = "sqlite+aiosqlite://"


@pytest.fixture
async def async_session():
    engine = create_async_engine(TEST_DATABASE_URL, echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    session_maker = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)
    async with session_maker() as session:
        yield session
    await engine.dispose()


async def _team(session, external_id: str, name, code=None, group=None):
    stmt = select(Team).where(Team.external_id == external_id)
    result = await session.execute(stmt)
    team = result.scalar_one_or_none()
    if not team:
        team = Team(external_id=external_id, name=name, code=code, group=group)
        session.add(team)
        await session.flush()
    return team


async def _fixture(session, external_id: str, home_team_id, away_team_id, kickoff_ist, status="scheduled", group=None):
    f = Fixture(
        external_id=external_id,
        home_team_id=home_team_id,
        away_team_id=away_team_id,
        kickoff_ist=kickoff_ist,
        status=status,
        group=group,
    )
    session.add(f)
    await session.flush()
    return f


async def _user(session, email, team_id, push_endpoint="https://push.example.com"):
    from app.db.models import NotificationPreference, User

    u = User(
        email=email,
        favorite_team_id=team_id,
        push_endpoint=push_endpoint,
        push_p256dh="p256dh",
        push_auth="auth",
        onboarding_complete=True,
    )
    session.add(u)
    await session.flush()
    np = NotificationPreference(
        user_id=u.id,
        match_reminders=True,
        goal_alerts=True,
        result_summaries=True,
    )
    session.add(np)
    await session.flush()
    return u


class TestFixtureSync:
    def test_imports(self):
        from app.jobs.fixture_sync import run_fixture_sync
        assert callable(run_fixture_sync)

    @pytest.mark.asyncio
    async def test_fixture_sync_creates_teams_and_fixtures(self, async_session):
        from app.jobs.fixture_sync import run_fixture_sync

        mock_tournament = {
            "teams": [
                {"name": "Brazil", "code": "BRA", "groupStage": {"group": "A"}},
                {"name": "Argentina", "code": "ARG", "groupStage": {"group": "A"}},
            ]
        }
        mock_matches = [
            {
                "id": "2026-001",
                "date": "2026-06-15",
                "kickoff": "19:00",
                "stage": "group_a",
                "stageNormalized": "group_a",
                "homeTeam": "Brazil",
                "awayTeam": "Argentina",
                "stadium": "Stadium A",
            }
        ]
        with patch("app.jobs.fixture_sync.zafronix_client") as mock_client:
            mock_client.get_tournament = AsyncMock(return_value=mock_tournament)
            mock_client.fetch_all_matches = AsyncMock(return_value=mock_matches)
            await run_fixture_sync(async_session)
            teams = (await async_session.execute(select(Team))).scalars().all()
            assert len(teams) == 2
            fixtures = (await async_session.execute(select(Fixture))).scalars().all()
            assert len(fixtures) == 1
            assert fixtures[0].external_id == "2026-001"

    @pytest.mark.asyncio
    async def test_fixture_sync_updates_existing_kickoff_ist(self, async_session):
        from app.jobs.fixture_sync import run_fixture_sync

        mock_tournament = {
            "teams": [
                {"name": "Brazil", "code": "BRA", "groupStage": {"group": "A"}},
                {"name": "Argentina", "code": "ARG", "groupStage": {"group": "A"}},
            ]
        }
        mock_matches_v1 = [
            {
                "id": "2026-010",
                "date": "2026-06-15",
                "kickoff": "19:00",
                "stage": "group_a",
                "homeTeam": "Brazil",
                "awayTeam": "Argentina",
                "stadium": "Stadium A",
            }
        ]
        mock_matches_v2 = [
            {
                "id": "2026-010",
                "date": "2026-06-16",
                "kickoff": "04:30",
                "kickoffUtc": "2026-06-15T23:00:00Z",
                "status": "finished",
                "homeScore": 1,
                "awayScore": 0,
                "stage": "group_a",
                "homeTeam": "Brazil",
                "awayTeam": "Argentina",
                "stadium": "Stadium A",
            }
        ]
        with patch("app.jobs.fixture_sync.zafronix_client") as mock_client:
            mock_client.get_tournament = AsyncMock(return_value=mock_tournament)
            mock_client.fetch_all_matches = AsyncMock(return_value=mock_matches_v1)
            await run_fixture_sync(async_session)
            mock_client.fetch_all_matches = AsyncMock(return_value=mock_matches_v2)
            await run_fixture_sync(async_session)

            fixtures = (await async_session.execute(select(Fixture))).scalars().all()
            assert len(fixtures) == 1
            assert fixtures[0].status == "finished"
            assert fixtures[0].home_score == 1
            assert fixtures[0].kickoff_ist.hour == 4

    @pytest.mark.asyncio
    async def test_fixture_sync_idempotent(self, async_session):
        from app.jobs.fixture_sync import run_fixture_sync

        mock_tournament = {
            "teams": [
                {"name": "Germany", "code": "GER", "groupStage": {"group": "B"}},
                {"name": "France", "code": "FRA", "groupStage": {"group": "B"}},
            ]
        }
        mock_matches = [
            {
                "id": "2026-002",
                "date": "2026-06-16",
                "kickoff": "21:00",
                "stage": "group_b",
                "stageNormalized": "group_b",
                "homeTeam": "Germany",
                "awayTeam": "France",
                "stadium": "Stadium B",
            }
        ]
        with patch("app.jobs.fixture_sync.zafronix_client") as mock_client:
            mock_client.get_tournament = AsyncMock(return_value=mock_tournament)
            mock_client.fetch_all_matches = AsyncMock(return_value=mock_matches)
            await run_fixture_sync(async_session)
            await run_fixture_sync(async_session)
            teams = (await async_session.execute(select(Team))).scalars().all()
            assert len(teams) == 2
            fixtures = (await async_session.execute(select(Fixture))).scalars().all()
            assert len(fixtures) == 1


class TestLivePoller:
    def test_imports(self):
        from app.jobs.live_poller import current_interval, run_live_poller
        assert callable(run_live_poller)
        assert callable(current_interval)

    @pytest.mark.asyncio
    async def test_current_interval_live(self, async_session):
        from app.jobs.live_poller import current_interval

        t1 = await _team(async_session, "T10", "Team A")
        t2 = await _team(async_session, "T11", "Team B")
        await _fixture(async_session, "F101", t1.id, t2.id, datetime.now(IST), status="live")
        await async_session.commit()

        interval = await current_interval(async_session)
        from app.config import settings
        assert interval == settings.poll_interval_live_sec

    @pytest.mark.asyncio
    async def test_current_interval_idle(self, async_session):
        from app.jobs.live_poller import current_interval

        interval = await current_interval(async_session)
        from app.config import settings
        assert interval == settings.poll_interval_idle_sec


class TestReminderScheduler:
    def test_imports(self):
        from app.jobs.reminder_scheduler import run_reminder_check
        assert callable(run_reminder_check)

    @pytest.mark.asyncio
    async def test_reminder_at_60_minutes(self, async_session):
        from app.jobs.reminder_scheduler import run_reminder_check

        now = datetime(2026, 6, 15, 18, 0, 0, tzinfo=IST)
        kickoff = now + timedelta(hours=1)
        t1 = await _team(async_session, "T20", "Home Team")
        t2 = await _team(async_session, "T21", "Away Team")
        await _fixture(async_session, "F201", t1.id, t2.id, kickoff, group="A")
        await _user(async_session, "user1@test.com", t1.id)
        await _user(async_session, "user2@test.com", t2.id)
        await async_session.commit()

        with patch("app.jobs.reminder_scheduler.render_match_reminder", new=AsyncMock(
                 return_value={"title": "Reminder", "body": "Match starts soon"}
             )), \
             patch("app.jobs.reminder_scheduler.create_and_fan_out", new=AsyncMock()):
            await run_reminder_check(async_session, now=now)
            dispatches = (await async_session.execute(select(ReminderDispatch))).scalars().all()
            assert len(dispatches) >= 1

    @pytest.mark.asyncio
    async def test_reminder_no_double_dispatch(self, async_session):
        from app.jobs.reminder_scheduler import run_reminder_check

        now = datetime(2026, 6, 15, 18, 0, 0, tzinfo=IST)
        kickoff = now + timedelta(hours=1)
        t1 = await _team(async_session, "T22", "Home Team")
        t2 = await _team(async_session, "T23", "Away Team")
        await _fixture(async_session, "F202", t1.id, t2.id, kickoff, group="A")
        await _user(async_session, "user3@test.com", t1.id)
        await async_session.commit()

        with patch("app.jobs.reminder_scheduler.render_match_reminder", new=AsyncMock(
                 return_value={"title": "Reminder", "body": "Match starts soon"}
             )), \
             patch("app.jobs.reminder_scheduler.create_and_fan_out", new=AsyncMock()):
            await run_reminder_check(async_session, now=now)
            await run_reminder_check(async_session, now=now)
            dispatches = (await async_session.execute(select(ReminderDispatch))).scalars().all()
            assert len(dispatches) == 1

    @pytest.mark.asyncio
    async def test_no_reminder_outside_window(self, async_session):
        from app.jobs.reminder_scheduler import run_reminder_check

        now = datetime(2026, 6, 15, 18, 0, 0, tzinfo=IST)
        kickoff = now + timedelta(minutes=30)
        t1 = await _team(async_session, "T24", "Home Team")
        t2 = await _team(async_session, "T25", "Away Team")
        await _fixture(async_session, "F203", t1.id, t2.id, kickoff, group="A")
        await _user(async_session, "user4@test.com", t1.id)
        await async_session.commit()

        with patch("app.jobs.reminder_scheduler.render_match_reminder", new=AsyncMock(
                 return_value={"title": "Reminder", "body": "Match starts soon"}
             )), \
             patch("app.jobs.reminder_scheduler.create_and_fan_out", new=AsyncMock()):
            await run_reminder_check(async_session, now=now)
            dispatches = (await async_session.execute(select(ReminderDispatch))).scalars().all()
            assert len(dispatches) == 0
