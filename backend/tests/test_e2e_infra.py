import os

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy import text

pytestmark = [
    pytest.mark.e2e,
    pytest.mark.skipif(
        not os.environ.get("E2E_TESTS"),
        reason="set E2E_TESTS=1 to run e2e tests against real Supabase + Upstash",
    ),
]


class TestDatabaseE2E:
    async def test_db_connectivity(self):
        from app.db.session import engine

        async with engine.connect() as conn:
            result = await conn.execute(text("SELECT 1"))
            assert result.scalar() == 1

    async def test_db_teams_table_exists(self):
        from app.db.session import engine

        async with engine.connect() as conn:
            result = await conn.execute(
                text("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'teams')")
            )
            assert result.scalar() is True

    async def test_db_alembic_version_current(self):
        from app.db.session import engine

        async with engine.connect() as conn:
            result = await conn.execute(text("SELECT version_num FROM alembic_version"))
            version = result.scalar()
        assert version == "ded3420b30bc"

    async def test_db_read_teams(self):
        from app.db.session import engine

        async with engine.connect() as conn:
            result = await conn.execute(text("SELECT COUNT(*) FROM teams"))
            count = result.scalar()
        assert isinstance(count, int)


class TestRedisCacheE2E:
    async def test_redis_connectivity(self):
        from app.services.cache import RedisCache

        cache = RedisCache()
        redis = await cache._get_redis()
        assert redis is not None
        await cache.close()

    async def test_redis_set_get(self):
        from app.services.cache import RedisCache

        cache = RedisCache()
        await cache.set("e2e:test", {"key": "value"}, ttl=60)
        result = await cache.get("e2e:test")
        assert result == {"key": "value"}
        await cache.delete("e2e:test")
        await cache.close()

    async def test_redis_delete(self):
        from app.services.cache import RedisCache

        cache = RedisCache()
        await cache.set("e2e:test:delete", {"data": "gone"}, ttl=60)
        await cache.delete("e2e:test:delete")
        result = await cache.get("e2e:test:delete")
        assert result is None
        await cache.close()

    async def test_redis_exists(self):
        from app.services.cache import RedisCache

        cache = RedisCache()
        await cache.set("e2e:test:exists", {"x": 1}, ttl=60)
        exists = await cache.exists("e2e:test:exists")
        assert exists is True
        await cache.delete("e2e:test:exists")
        exists = await cache.exists("e2e:test:exists")
        assert exists is False
        await cache.close()

    async def test_redis_incr(self):
        from app.services.cache import RedisCache

        cache = RedisCache()
        v1 = await cache.incr("e2e:test:counter", ttl=60)
        v2 = await cache.incr("e2e:test:counter", ttl=60)
        assert v1 == 1
        assert v2 == 2
        await cache.delete("e2e:test:counter")
        await cache.close()


class TestHealthEndpointE2E:
    async def test_health_returns_ok(self):
        from app.main import app

        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test",
        ) as client:
            response = await client.get("/api/v1/health")
        assert response.status_code == 200
        body = response.json()
        assert body["status"] == "ok"
        assert body["db"] == "ok"
        assert body["redis"] == "ok"
