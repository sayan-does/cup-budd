import asyncio

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import Team
from app.db.session import get_db
from app.schemas.teams import StandingEntry, TeamResponse
from app.services.cache import redis_cache
from app.services.zafronix_client import zafronix_client

router = APIRouter(prefix="/standings", tags=["standings"])


def _parse_standings(raw: dict, group: str) -> list[dict]:
    groups = raw.get("groups", {})
    entries = groups.get(group, groups.get(group.upper(), []))
    if not entries and "standings" in raw:
        entries = raw["standings"]
    if not entries and isinstance(raw, list):
        entries = raw
    if not entries and isinstance(raw, dict):
        for val in raw.values():
            if isinstance(val, list):
                entries = val
                break
    return entries if isinstance(entries, list) else []


@router.get("", response_model=list[StandingEntry])
async def get_standings(group: str = Query(...), db: AsyncSession = Depends(get_db)):
    if not group:
        raise HTTPException(status_code=400, detail="group query parameter is required")

    cache_key = f"standings:group:{group}"
    cached = await redis_cache.get(cache_key)
    standings_data = cached.get("standings") if cached else None
    if not standings_data:
        try:
            # Bound the external standings fetch so a slow third-party call
            # doesn't hang the API. If it times out or fails, continue with
            # empty standings to keep the UI responsive.
            result = await asyncio.wait_for(
                zafronix_client.get_standings(2026, group), timeout=2.0
            )
            standings_data = _parse_standings(result, group)
        except Exception:
            standings_data = None

    entries: list[StandingEntry] = []
    if standings_data:
        for entry in standings_data:
            raw_name = entry.get("team") or entry.get("name") or ""
            name = raw_name.strip()
            try:
                pos = int(entry.get("position") or 0)
                played = int(entry.get("played") or 0)
                won = int(entry.get("won") or 0)
                drawn = int(entry.get("drawn") or 0)
                lost = int(entry.get("lost") or 0)
                points = int(entry.get("points") or 0)
                goals_for = int(entry.get("goalsFor") or 0)
                goals_against = int(entry.get("goalsAgainst") or 0)
            except Exception:
                # skip malformed entries
                continue

            # Try to resolve the team from the database by name (case-insensitive)
            team_obj = None
            try:
                result = await db.execute(select(Team).where(func.lower(Team.name) == name.lower()))
                team_obj = result.scalar_one_or_none()
            except Exception:
                team_obj = None

            if team_obj:
                team_resp = TeamResponse(
                    id=team_obj.id,
                    name=team_obj.name,
                    code=team_obj.code or "",
                    group=team_obj.group or group,
                    logo_url=team_obj.logo_url,
                )
            else:
                team_resp = TeamResponse(id=0, name=name or "", code="", group=group)

            entries.append(
                StandingEntry(
                    position=pos,
                    team=team_resp,
                    played=played,
                    won=won,
                    drawn=drawn,
                    lost=lost,
                    points=points,
                    goals_for=goals_for,
                    goals_against=goals_against,
                )
            )

    # sort by position for group-wise table
    entries.sort(key=lambda e: e.position)
    return entries
