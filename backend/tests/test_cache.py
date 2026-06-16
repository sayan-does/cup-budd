import pytest


class TestRedisCache:
    def test_cache_import(self):
        from app.services.cache import RedisCache, redis_cache
        assert redis_cache is not None
        assert RedisCache is not None

    def test_cache_initialization(self):
        from app.services.cache import RedisCache
        cache = RedisCache()
        assert cache._redis is None

    @pytest.mark.asyncio
    async def test_cache_close_no_error(self):
        from app.services.cache import redis_cache
        await redis_cache.close()
