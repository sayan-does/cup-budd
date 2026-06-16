import logging
from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import Fixture, Team
from app.db.session import async_session_maker
from app.services.cache import redis_cache
from app.services.event_sync import upsert_event
from app.services.kickoff import parse_kickoff_ist
from app.services.status_reconciliation import reconcile_stale_fixtures
from app.services.zafronix_client import zafronix_client

logger = logging.getLogger(__name__)


async def run_live_poll_cycle() -> None:
    async with async_session_maker() as db:
        try:
            livescores = await zafronix_client.get_live_matches()
        except Exception as exc:
            logger.warning("Live poll skipped (live fetch failed): %s", exc)
            livescores = []

        for match in livescores or []:
            await _process_match(db, match)

        await reconcile_stale_fixtures(db)


async def _process_match(db: AsyncSession, match: dict) -> None:
    match_id = match.get("id")
    if not match_id:
        return

    cache_key = f"fixture:{match_id}:state"
    cached_state = await redis_cache.get(cache_key)

    home_score = match.get("homeScore")
    away_score = match.get("awayScore")
    status = "live"

    fixture = await _upsert_fixture(db, match_id, match, status)

    if fixture is None:
        return

    events_changed = (
        cached_state is None
        or cached_state.get("status") != status
        or cached_state.get("home_score") != home_score
        or cached_state.get("away_score") != away_score
    )

    if events_changed:
        goals = match.get("goals") or match.get("events") or []
        for goal in goals:
            if isinstance(goal, dict):
                await upsert_event(db, fixture, goal, goal.get("type", "goal"))

    await redis_cache.set(
        cache_key,
        {
            "status": status,
            "home_score": home_score,
            "away_score": away_score,
            "kickoff_ist": fixture.kickoff_ist.isoformat(),
            "last_changed": datetime.now(UTC).isoformat(),
        },
        ttl=86400,
    )


async def _upsert_fixture(
    db: AsyncSession, external_id: str, match: dict, status: str
) -> Fixture | None:
    stmt = select(Fixture).where(Fixture.external_id == external_id)
    result = await db.execute(stmt)
    fixture = result.scalar_one_or_none()

    if fixture is None:
        home_name = match.get("homeTeam")
        away_name = match.get("awayTeam")
        if not home_name or not away_name:
            return None

        home_team = await _get_team_by_name(db, home_name)
        away_team = await _get_team_by_name(db, away_name)

        if home_team is None or away_team is None:
            return None

        kickoff_ist = parse_kickoff_ist(match)
        stage = match.get("stageNormalized") or match.get("stage", "")
        group = _extract_group(stage)

        fixture = Fixture(
            external_id=external_id,
            home_team_id=home_team.id,
            away_team_id=away_team.id,
            kickoff_ist=kickoff_ist,
            status=status,
            home_score=match.get("homeScore"),
            away_score=match.get("awayScore"),
            stage=stage,
            round_code=match.get("stage", ""),
            location=match.get("stadium"),
            group=group,
        )
        db.add(fixture)
    else:
        fixture.status = status
        if match.get("homeScore") is not None:
            fixture.home_score = match.get("homeScore")
        if match.get("awayScore") is not None:
            fixture.away_score = match.get("awayScore")

    await db.commit()
    await db.refresh(fixture)
    return fixture


async def _get_team_by_name(db: AsyncSession, name: str) -> Team | None:
    stmt = select(Team).where(Team.name == name)
    result = await db.execute(stmt)
    return result.scalar_one_or_none()


def _extract_group(stage: str) -> str:
    if stage.startswith("group_"):
        return stage.split("_")[-1].upper()
    return ""
