from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.db.models import Fixture
from app.db.session import async_session_maker
from app.services.polling import run_live_poll_cycle


async def run_live_poller(db: AsyncSession | None = None) -> None:
    await run_live_poll_cycle()


async def current_interval(db: AsyncSession | None = None) -> int:
    if db is None:
        async with async_session_maker() as session:
            return await _check_interval(session)
    return await _check_interval(db)


async def _check_interval(db: AsyncSession) -> int:
    stmt = select(func.count()).select_from(Fixture).where(Fixture.status == "live")
    result = await db.execute(stmt)
    count = result.scalar()
    if count and count > 0:
        return settings.poll_interval_live_sec
    return settings.poll_interval_idle_sec
