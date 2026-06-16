import pytest
from unittest.mock import AsyncMock, patch
from sqlalchemy import select

from app.db.models import Fixture, Team


@pytest.mark.asyncio
async def test_fixture_sync_reports_incomplete_teams(async_session):
    from app.jobs.fixture_sync import run_fixture_sync

    mock_tournament = {
        "teams": [
            {"name": "X", "code": "X", "groupStage": {"group": "A"}},
        ]
    }
    # here match references unknown team Y, so should be recorded as skipped
    mock_matches = [
        {"id": "m100", "stage": "group_a", "homeTeam": "X", "awayTeam": "Y"}
    ]

    with patch("app.jobs.fixture_sync.zafronix_client") as mock_client:
        mock_client.get_tournament = AsyncMock(return_value=mock_tournament)
        mock_client.fetch_all_matches = AsyncMock(return_value=mock_matches)
        await run_fixture_sync(async_session)

        teams = (await async_session.execute(select(Team))).scalars().all()
        assert len(teams) == 1

        fixtures = (await async_session.execute(select(Fixture))).scalars().all()
        # no fixtures upserted because away team unknown
        assert len(fixtures) == 0
