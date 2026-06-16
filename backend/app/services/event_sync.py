import logging
import re

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import Fixture, MatchEvent, Team
from app.services.zafronix_client import zafronix_client

logger = logging.getLogger(__name__)

_CARD_TYPE_MAP = {
    "yellow": "yellow_card",
    "yellow_card": "yellow_card",
    "red": "red_card",
    "red_card": "red_card",
}


def _slug(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "_", value.lower()).strip("_") or "unknown"


def _normalize_cards(raw: object) -> list[dict]:
    if isinstance(raw, list):
        return [c for c in raw if isinstance(c, dict)]
    return []


def _event_player(payload: dict) -> str | None:
    return payload.get("scorer") or payload.get("player") or payload.get("name")


async def _get_team_by_name(db: AsyncSession, name: str) -> Team | None:
    if not name:
        return None
    stmt = select(Team).where(Team.name == name)
    result = await db.execute(stmt)
    return result.scalar_one_or_none()


async def _resolve_team_id(
    db: AsyncSession, fixture: Fixture, payload: dict
) -> int | None:
    team_name = payload.get("team", "")
    if not team_name:
        side = payload.get("teamSide") or payload.get("side")
        if side == "home":
            return fixture.home_team_id
        if side == "away":
            return fixture.away_team_id
        return None
    team = await _get_team_by_name(db, team_name)
    return team.id if team else None


async def upsert_event(
    db: AsyncSession,
    fixture: Fixture,
    payload: dict,
    event_type: str,
) -> None:
    minute = payload.get("minute")
    player = _event_player(payload) or "unknown"
    external_id = f"{fixture.id}:{event_type}:{minute}:{_slug(player)}"

    stmt = select(MatchEvent).where(MatchEvent.external_id == external_id)
    result = await db.execute(stmt)
    if result.scalar_one_or_none():
        return

    team_id = await _resolve_team_id(db, fixture, payload)
    match_event = MatchEvent(
        fixture_id=fixture.id,
        external_id=external_id,
        event_type=event_type,
        team_id=team_id,
        minute=minute,
        payload=payload,
    )
    db.add(match_event)
    await db.commit()


async def sync_events_from_zafronix(db: AsyncSession, fixture: Fixture) -> int:
    try:
        raw = await zafronix_client.get_match(fixture.external_id, denormalize=True)
    except Exception as exc:
        logger.warning("Event sync failed for fixture %s: %s", fixture.external_id, exc)
        return 0

    if not raw:
        return 0

    synced = 0
    for goal in raw.get("goals") or []:
        if isinstance(goal, dict):
            await upsert_event(db, fixture, goal, goal.get("type", "goal"))
            synced += 1

    for card in _normalize_cards(raw.get("cards")):
        raw_type = str(card.get("type", "yellow")).lower()
        event_type = _CARD_TYPE_MAP.get(raw_type, "yellow_card")
        await upsert_event(db, fixture, card, event_type)
        synced += 1

    return synced


async def sync_events_if_needed(db: AsyncSession, fixture: Fixture) -> None:
    stmt = select(MatchEvent).where(MatchEvent.fixture_id == fixture.id)
    result = await db.execute(stmt)
    if result.scalars().first():
        return
    await sync_events_from_zafronix(db, fixture)
