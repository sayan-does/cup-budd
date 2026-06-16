from unittest.mock import AsyncMock, patch

import pytest
from httpx import ASGITransport, AsyncClient


@pytest.mark.asyncio
async def test_health_endpoint():
    with patch("app.main.scheduler.start", return_value=None), \
         patch("app.main.scheduler.shutdown", return_value=None), \
         patch("app.main.fixture_sync.run_fixture_sync", new=AsyncMock()), \
         patch("app.main.async_session_maker") as mock_session_maker:
        mock_session = AsyncMock()
        mock_session.__aenter__.return_value = mock_session
        mock_session_maker.return_value = mock_session
        from app.main import app
        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test",
        ) as client:
            response = await client.get("/api/v1/health")
            assert response.status_code == 200
