from datetime import datetime

import pytest

from app.db.models import Fixture, Team
from app.services.kickoff import IST


@pytest.mark.asyncio
async def test_team_fixture_coverage_fields(async_session):
    # create a team in group A with two group fixtures
    t = Team(external_id="T1", name="Team 1", code="T1", group="A")
    async_session.add(t)
    await async_session.flush()

    now = datetime(2026, 6, 15, 12, 0, tzinfo=IST)
    # two group fixtures
    f1 = Fixture(external_id="f1", home_team_id=t.id, away_team_id=t.id, kickoff_ist=now, group="A")
    f2 = Fixture(external_id="f2", home_team_id=t.id, away_team_id=t.id, kickoff_ist=now, group="A")
    async_session.add_all([f1, f2])
    await async_session.commit()

    from app.api.v1.teams import get_team

    resp = await get_team(t.id, async_session)
    assert resp.fixture_coverage is not None
    assert resp.fixture_coverage["group_fixtures"] == 2
    assert resp.fixture_coverage["expected_group_fixtures"] == 3
    assert resp.fixture_coverage["sync_complete"] is False
