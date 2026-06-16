import logging

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import Fixture
from app.services.kickoff import now_ist
from app.services.match_buckets import classify_bucket
from app.services.zafronix_client import normalize_status, zafronix_client

logger = logging.getLogger(__name__)


async def reconcile_stale_fixtures(db: AsyncSession) -> int:
    """Promote stale scheduled/live rows to finished when bucket logic says past."""
    now = now_ist()
    stmt = select(Fixture).where(Fixture.status.in_(["scheduled", "live"]))
    result = await db.execute(stmt)
    fixtures = list(result.scalars().all())

    updated = 0
    for fixture in fixtures:
        if classify_bucket(fixture, now) != "past":
            continue

        raw: dict = {}
        try:
            raw = await zafronix_client.get_match(fixture.external_id)
            if raw:
                fixture.status = normalize_status(raw.get("status", "finished"))
                if raw.get("homeScore") is not None:
                    fixture.home_score = raw.get("homeScore")
                if raw.get("awayScore") is not None:
                    fixture.away_score = raw.get("awayScore")
        except Exception as exc:
            logger.debug("Zafronix status lookup failed for %s: %s", fixture.external_id, exc)

        if fixture.status in ("scheduled", "live"):
            fixture.status = "finished"

        updated += 1

    if updated:
        await db.commit()

    return updated
