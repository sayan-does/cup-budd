import asyncio

from fastapi import APIRouter, Depends, HTTPException, Query, Request
import logging
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import Fixture, Team
from app.db.session import get_db
from app.schemas.matches import TeamSummary
from app.schemas.teams import (
    MatchSummary,
    StandingEntry,
    StandingInfo,
    TeamDetailResponse,
    TeamResponse,
)
from app.services.cache import redis_cache
from app.services.kickoff import now_ist
from app.services.match_buckets import classify_bucket
from app.services.zafronix_client import zafronix_client

router = APIRouter(prefix="/teams", tags=["teams"])


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


def _build_team_response(team: Team) -> TeamResponse:
    return TeamResponse(
        id=team.id,
        name=team.name,
        code=team.code or "",
        group=team.group or "",
        logo_url=team.logo_url,
        emoji=team.emoji,
    )


def _build_team_summary(team: Team) -> TeamSummary:
    return TeamSummary(
        id=team.id,
        name=team.name,
        code=team.code or "",
        logo_url=team.logo_url,
        emoji=team.emoji,
    )


def _build_match_summary(fixture: Fixture, home_team: Team, away_team: Team) -> MatchSummary:
    return MatchSummary(
        id=fixture.id,
        home_team=_build_team_response(home_team),
        away_team=_build_team_response(away_team),
        home_score=fixture.home_score,
        away_score=fixture.away_score,
        status=fixture.status,
        stage=fixture.stage or "",
        datetime=fixture.kickoff_ist.isoformat(),
        venue=fixture.location or "",
    )


@router.get("", response_model=list[TeamResponse])
async def list_teams(
    group: str | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
    request: Request = None,
) -> list[TeamResponse]:
    # Log incoming request details to help diagnose missing frontend calls.
    try:
        logger = logging.getLogger("app.teams")
        origin = request.headers.get("origin") if request else None
        logger.info(
            "list_teams called from client=%s origin=%s path=%s",
            getattr(request.client, 'host', None) if request else None,
            origin,
            request.url.path if request else None,
        )
    except Exception:
        # Don't let logging failures affect the endpoint
        pass
    stmt = select(Team)
    if group:
        stmt = stmt.where(Team.group == group)
    stmt = stmt.order_by(Team.group, Team.name)
    result = await db.execute(stmt)
    teams = list(result.scalars().all())
    return [_build_team_response(t) for t in teams]


@router.get("/{team_id}", response_model=TeamDetailResponse)
async def get_team(
    team_id: int,
    db: AsyncSession = Depends(get_db),
) -> TeamDetailResponse:
    stmt = select(Team).where(Team.id == team_id)
    result = await db.execute(stmt)
    team = result.scalar_one_or_none()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    standing = None
    if team.group:
        cache_key = f"standings:group:{team.group}"
        cached = await redis_cache.get(cache_key)
        standings_data = cached.get("standings") if cached else None
        if not standings_data:
            try:
                # Bound the external standings fetch to avoid blocking the request
                result = await asyncio.wait_for(
                    zafronix_client.get_standings(2026, team.group), timeout=2.0
                )
                standings_data = _parse_standings(result, team.group)
            except Exception:
                # On timeout or failure, proceed without standings to keep
                # the team detail endpoint responsive.
                standings_data = None

    if standings_data:
            def _to_int(val: object) -> int:
                try:
                    # coerce None or non-int values to 0
                    return int(val) if val is not None else 0
                except Exception:
                    return 0

            entries: list[StandingEntry] = []
            for entry in standings_data:
                name = entry.get("team") or entry.get("name")
                try:
                    # normalize and coerce numeric fields
                    e = StandingEntry(
                        position=_to_int(entry.get("position")),
                        team=TeamResponse(
                            id=0,
                            name=name or "",
                            code="",
                            group=team.group or "",
                        ),
                        played=_to_int(entry.get("played")),
                        won=_to_int(entry.get("won")),
                        drawn=_to_int(entry.get("drawn")),
                        lost=_to_int(entry.get("lost")),
                        points=_to_int(entry.get("points")),
                        goals_for=_to_int(entry.get("goalsFor")),
                        goals_against=_to_int(entry.get("goalsAgainst")),
                    )
                    entries.append(e)
                except Exception:
                    # skip malformed entries
                    continue

            # If we found an entry matching this team name, use it for the single-team
            # standing on the team detail response
            for e in entries:
                if e.team.name == team.name:
                    standing = StandingInfo(
                        position=e.position,
                        played=e.played,
                        won=e.won,
                        drawn=e.drawn,
                        lost=e.lost,
                        points=e.points,
                        goals_for=e.goals_for,
                        goals_against=e.goals_against,
                    )
                    break

    now = now_ist()
    team_fixtures_stmt = select(Fixture).where(
        or_(Fixture.home_team_id == team_id, Fixture.away_team_id == team_id)
    )
    team_fixtures_result = await db.execute(team_fixtures_stmt)
    team_fixtures = list(team_fixtures_result.scalars().all())

    live_fixture = next(
        (f for f in team_fixtures if classify_bucket(f, now) == "live"),
        None,
    )
    next_fixture = next(
        (
            f
            for f in sorted(team_fixtures, key=lambda f: f.kickoff_ist)
            if classify_bucket(f, now) == "upcoming"
        ),
        None,
    )

    next_summary = None
    if next_fixture:
        home = await db.execute(select(Team).where(Team.id == next_fixture.home_team_id))
        away = await db.execute(select(Team).where(Team.id == next_fixture.away_team_id))
        next_summary = _build_match_summary(
            next_fixture, home.scalar_one(), away.scalar_one()
        )

    live_summary = None
    if live_fixture:
        home = await db.execute(select(Team).where(Team.id == live_fixture.home_team_id))
        away = await db.execute(select(Team).where(Team.id == live_fixture.away_team_id))
        live_summary = _build_match_summary(
            live_fixture, home.scalar_one(), away.scalar_one()
        )

    # Compute fixture coverage for frontend contextual empty states
    group_fixtures = 0
    for f in team_fixtures:
        if f.group and f.group.upper() == team.group.upper():
            group_fixtures += 1

    # expected_group_fixtures: default 3 for teams assigned a group, else 0
    expected_group_fixtures = 3 if team.group else 0

    now = now_ist()
    has_upcoming = any(classify_bucket(f, now) == "upcoming" for f in team_fixtures)
    has_past = any(classify_bucket(f, now) == "past" for f in team_fixtures)
    sync_complete = group_fixtures >= expected_group_fixtures if expected_group_fixtures > 0 else True

    fixture_coverage = {
        "group_fixtures": group_fixtures,
        "expected_group_fixtures": expected_group_fixtures,
        "has_upcoming": has_upcoming,
        "has_past": has_past,
        "sync_complete": sync_complete,
    }

    return TeamDetailResponse(
        id=team.id,
        name=team.name,
        code=team.code or "",
        group=team.group or "",
        logo_url=team.logo_url,
        emoji=team.emoji,
        standing=standing,
        next_fixture=next_summary,
        live_fixture=live_summary,
        fixture_coverage=fixture_coverage,
    )
