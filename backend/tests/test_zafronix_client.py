import pytest
from unittest.mock import AsyncMock


class TestZafronixClient:
    def test_client_import(self):
        from app.services.zafronix_client import ZafronixClient, zafronix_client
        assert zafronix_client is not None
        assert ZafronixClient is not None

    def test_client_initialization(self):
        from app.services.zafronix_client import ZafronixClient
        client = ZafronixClient()
        assert "api.zafronix.com" in client.base_url
        assert client.api_key is not None
        assert client._client is None

    @pytest.mark.asyncio
    async def test_client_close_no_error(self):
        from app.services.zafronix_client import zafronix_client
        await zafronix_client.close()

    @pytest.mark.asyncio
    async def test_fetch_all_matches_paginates(self):
        from app.services.zafronix_client import ZafronixClient

        client = ZafronixClient()
        client.get_matches = AsyncMock(
            side_effect=[
                {
                    "data": [{"id": "2026-001"}, {"id": "2026-002"}],
                    "pagination": {"hasMore": True, "nextCursor": "page2"},
                },
                {
                    "data": [{"id": "2026-003"}],
                    "pagination": {"hasMore": False},
                },
            ]
        )

        matches = await client.fetch_all_matches(2026)

        assert [m["id"] for m in matches] == ["2026-001", "2026-002", "2026-003"]
        assert client.get_matches.await_count == 2
        client.get_matches.assert_any_await(2026, stage=None, team=None, limit=500, cursor=None)
        client.get_matches.assert_any_await(
            2026, stage=None, team=None, limit=500, cursor="page2"
        )
