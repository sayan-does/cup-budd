from datetime import timedelta
from unittest.mock import AsyncMock, patch

import pytest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.db.models import Base, Fixture, Team
from app.services.kickoff import IST, now_ist
from app.services.status_reconciliation import reconcile_stale_fixtures

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


async def _seed_stale_fixture(session: AsyncSession) -> Fixture:
    home = Team(external_id="H1", name="Home FC", code="H1", group="A")
    away = Team(external_id="A1", name="Away FC", code="A1", group="A")
    session.add_all([home, away])
    await session.flush()

    fixture = Fixture(
        external_id="stale-001",
        home_team_id=home.id,
        away_team_id=away.id,
        kickoff_ist=now_ist() - timedelta(hours=3),
        status="scheduled",
    )
    session.add(fixture)
    await session.commit()
    await session.refresh(fixture)
    return fixture


@pytest.mark.asyncio
async def test_reconcile_stale_fixture_via_zafronix(async_session):
    fixture = await _seed_stale_fixture(async_session)

    with patch(
        "app.services.status_reconciliation.zafronix_client.get_match",
        new=AsyncMock(return_value={"status": "finished", "homeScore": 2, "awayScore": 1}),
    ):
        count = await reconcile_stale_fixtures(async_session)

    assert count == 1
    refreshed = (
        await async_session.execute(select(Fixture).where(Fixture.id == fixture.id))
    ).scalar_one()
    assert refreshed.status == "finished"
    assert refreshed.home_score == 2
    assert refreshed.away_score == 1


@pytest.mark.asyncio
async def test_reconcile_stale_fixture_fallback_when_zafronix_fails(async_session):
    fixture = await _seed_stale_fixture(async_session)

    with patch(
        "app.services.status_reconciliation.zafronix_client.get_match",
        new=AsyncMock(side_effect=Exception("api down")),
    ):
        count = await reconcile_stale_fixtures(async_session)

    assert count == 1
    refreshed = (
        await async_session.execute(select(Fixture).where(Fixture.id == fixture.id))
    ).scalar_one()
    assert refreshed.status == "finished"


@pytest.mark.asyncio
async def test_reconcile_skips_upcoming_fixtures(async_session):
    home = Team(external_id="H2", name="Home 2", code="H2", group="A")
    away = Team(external_id="A2", name="Away 2", code="A2", group="A")
    async_session.add_all([home, away])
    await async_session.flush()

    fixture = Fixture(
        external_id="future-001",
        home_team_id=home.id,
        away_team_id=away.id,
        kickoff_ist=now_ist() + timedelta(days=1),
        status="scheduled",
    )
    async_session.add(fixture)
    await async_session.commit()

    with patch(
        "app.services.status_reconciliation.zafronix_client.get_match",
        new=AsyncMock(),
    ) as mock_get:
        count = await reconcile_stale_fixtures(async_session)
        mock_get.assert_not_called()

    assert count == 0
