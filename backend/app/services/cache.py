import json
import logging
from contextlib import suppress

import redis.asyncio as aioredis

from app.config import settings

logger = logging.getLogger(__name__)


class RedisCache:
    def __init__(self) -> None:
        self._redis: aioredis.Redis | None = None

    async def _get_redis(self) -> aioredis.Redis | None:
        if self._redis is None:
            try:
                self._redis = aioredis.from_url(
                    settings.redis_url,
                    decode_responses=True,
                )
                await self._redis.ping()
            except Exception:
                logger.warning("Redis unavailable, cache disabled")
                self._redis = None
        return self._redis

    async def get(self, key: str) -> dict | None:
        redis = await self._get_redis()
        if redis is None:
            return None
        try:
            value = await redis.get(key)
            if value is None:
                return None
            return json.loads(value)
        except Exception:
            return None

    async def set(self, key: str, value: dict, ttl: int = 300) -> None:
        redis = await self._get_redis()
        if redis is None:
            return
        with suppress(Exception):
            await redis.setex(key, ttl, json.dumps(value))

    async def delete(self, key: str) -> None:
        redis = await self._get_redis()
        if redis is None:
            return
        with suppress(Exception):
            await redis.delete(key)

    async def exists(self, key: str) -> bool:
        redis = await self._get_redis()
        if redis is None:
            return False
        try:
            return await redis.exists(key) > 0
        except Exception:
            return False

    async def incr(self, key: str, ttl: int = 60) -> int:
        redis = await self._get_redis()
        if redis is None:
            return 0
        try:
            count = await redis.incr(key)
            if count == 1:
                await redis.expire(key, ttl)
            return count
        except Exception:
            return 0

    async def close(self) -> None:
        if self._redis:
            with suppress(Exception):
                await self._redis.aclose()
            self._redis = None


redis_cache = RedisCache()
