from datetime import timedelta
from unittest.mock import AsyncMock, patch

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.db.models import Base, Fixture, Team
from app.db.session import get_db
from app.services.kickoff import now_ist

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


async def _seed_fixtures(session: AsyncSession) -> None:
    from sqlalchemy import select

    for code, name in [("H1", "Home FC"), ("A1", "Away FC")]:
        session.add(Team(external_id=code, name=name, code=code, group="A"))
    await session.flush()

    home = (await session.execute(select(Team).where(Team.code == "H1"))).scalar_one()
    away = (await session.execute(select(Team).where(Team.code == "A1"))).scalar_one()
    now = now_ist()

    session.add_all(
        [
            Fixture(
                external_id="past-finished",
                home_team_id=home.id,
                away_team_id=away.id,
                kickoff_ist=now - timedelta(days=1),
                status="finished",
                home_score=2,
                away_score=1,
            ),
            Fixture(
                external_id="past-stale",
                home_team_id=home.id,
                away_team_id=away.id,
                kickoff_ist=now - timedelta(hours=3),
                status="scheduled",
            ),
            Fixture(
                external_id="live-now",
                home_team_id=home.id,
                away_team_id=away.id,
                kickoff_ist=now - timedelta(minutes=30),
                status="live",
                home_score=1,
                away_score=0,
            ),
            Fixture(
                external_id="live-window",
                home_team_id=home.id,
                away_team_id=away.id,
                kickoff_ist=now - timedelta(minutes=15),
                status="scheduled",
            ),
            Fixture(
                external_id="upcoming",
                home_team_id=home.id,
                away_team_id=away.id,
                kickoff_ist=now + timedelta(days=2),
                status="scheduled",
            ),
        ]
    )
    await session.commit()


@pytest.fixture
async def app_client(async_session):
    async def override_get_db():
        yield async_session

    with patch("app.main.scheduler.start", return_value=None), \
         patch("app.main.scheduler.shutdown", return_value=None), \
         patch("app.main.fixture_sync.run_fixture_sync", new=AsyncMock()):
        from app.main import app

        app.dependency_overrides[get_db] = override_get_db
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            yield client
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_list_matches_bucket_past(app_client, async_session):
    await _seed_fixtures(async_session)
    response = await app_client.get("/api/v1/matches?bucket=past")
    assert response.status_code == 200
    statuses = {m["status"] for m in response.json()}
    assert "finished" in statuses
    assert "scheduled" in statuses


@pytest.mark.asyncio
async def test_list_matches_bucket_live(app_client, async_session):
    await _seed_fixtures(async_session)
    response = await app_client.get("/api/v1/matches?bucket=live")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    assert {m["status"] for m in data} <= {"live", "scheduled"}


@pytest.mark.asyncio
async def test_list_matches_bucket_upcoming_excludes_past(app_client, async_session):
    await _seed_fixtures(async_session)
    response = await app_client.get("/api/v1/matches?bucket=upcoming")
    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["status"] == "scheduled"


@pytest.mark.asyncio
async def test_get_match_syncs_events_when_empty(app_client, async_session):
    from sqlalchemy import select

    await _seed_fixtures(async_session)
    fixture = (
        await async_session.execute(select(Fixture).where(Fixture.external_id == "past-finished"))
    ).scalar_one()

    zafronix_payload = {
        "goals": [{"minute": 10, "scorer": "Player One", "team": "Home FC", "type": "goal"}],
        "cards": [{"minute": 55, "player": "Player Two", "team": "Away FC", "type": "yellow"}],
    }

    with patch("app.services.event_sync.zafronix_client.get_match", new=AsyncMock(return_value=zafronix_payload)):
        response = await app_client.get(f"/api/v1/matches/{fixture.id}")

    assert response.status_code == 200
    events = response.json()["events"]
    assert len(events) == 2
    types = {e["type"] for e in events}
    assert types == {"goal", "yellow_card"}
    assert any(e.get("player") == "Player One" for e in events)


@pytest.mark.asyncio
async def test_list_matches_invalid_bucket(app_client):
    response = await app_client.get("/api/v1/matches?bucket=invalid")
    assert response.status_code == 422
