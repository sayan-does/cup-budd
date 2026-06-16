from unittest.mock import AsyncMock

import pytest


class TestZafronixTournamentFetcher:
    @pytest.mark.asyncio
    async def test_fetch_tournament_matches_dedupe_and_failure(self):
        from app.services.zafronix_client import ZafronixClient

        client = ZafronixClient()

        async def fake_fetch(year, stage=None, team=None, page_limit=500, cursor=None):
            # bulk fetch
            if stage is None:
                return [{"id": "m1"}, {"id": "m2"}]
            # group_a returns a duplicate and a new one
            if stage == "group_a":
                return [{"id": "m1"}, {"id": "m3"}]
            # r16 fails
            if stage == "r16":
                raise Exception("r16 failure")
            return []

        client.fetch_all_matches = AsyncMock(side_effect=fake_fetch)

        matches, failed = await client.fetch_tournament_matches(2026)

        ids = sorted([m["id"] for m in matches])
        assert ids == ["m1", "m2", "m3"]
        assert "r16" in failed
