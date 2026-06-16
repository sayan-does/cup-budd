from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import and_, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import Fixture, MatchEvent, Team
from app.db.session import get_db
from app.schemas.matches import MatchEventResponse, MatchResponse, TeamSummary
from app.services.event_sync import sync_events_if_needed
from app.services.kickoff import now_ist
from app.services.match_buckets import Bucket, bucket_sort_key, classify_bucket

router = APIRouter(prefix="/matches", tags=["matches"])


def _build_team_summary(team: Team | None) -> TeamSummary:
    if not team:
        return TeamSummary(id=0, name="Unknown")
    return TeamSummary(
        id=team.id,
        name=team.name,
        code=team.code or "",
        logo_url=team.logo_url,
        emoji=team.emoji,
    )


def _build_match_from_fixture(fixture: Fixture, home_team: Team, away_team: Team) -> MatchResponse:
    return MatchResponse(
        id=fixture.id,
        home_team=_build_team_summary(home_team),
        away_team=_build_team_summary(away_team),
        home_score=fixture.home_score,
        away_score=fixture.away_score,
        status=fixture.status,
        stage=fixture.stage or "",
        datetime=fixture.kickoff_ist.isoformat(),
        venue=fixture.location or "",
    )


def _build_event(event: MatchEvent, fixture: Fixture) -> MatchEventResponse:
    team_side = ""
    if event.team_id == fixture.home_team_id:
        team_side = "home"
    elif event.team_id == fixture.away_team_id:
        team_side = "away"
    player = event.payload.get("scorer") or event.payload.get("player") or event.payload.get("name")
    return MatchEventResponse(
        minute=event.minute,
        type=event.event_type,
        player=player,
        team=team_side,
    )


def _resolve_bucket(
    bucket: str | None, status: str | None
) -> Bucket | None:
    if bucket:
        if bucket not in ("live", "upcoming", "past"):
            raise HTTPException(status_code=422, detail="Invalid bucket")
        return bucket  # type: ignore[return-value]
    if status == "upcoming":
        return "upcoming"
    if status == "finished":
        return "past"
    if status == "live":
        return "live"
    return None


def _filter_by_bucket(
    fixtures: list[Fixture], bucket: Bucket, now=None
) -> list[Fixture]:
    filtered = [f for f in fixtures if classify_bucket(f, now) == bucket]
    reverse = bucket == "past"
    filtered.sort(key=lambda f: bucket_sort_key(f, bucket), reverse=reverse)
    return filtered


@router.get("", response_model=list[MatchResponse])
async def list_matches(
    team_id: int | None = Query(default=None),
    status: str | None = Query(default=None),
    bucket: str | None = Query(default=None),
    limit: int = Query(default=50, le=50),
    db: AsyncSession = Depends(get_db),
) -> list[MatchResponse]:
    resolved_bucket = _resolve_bucket(bucket, status)

    stmt = select(Fixture)
    conditions = []
    if team_id:
        conditions.append(
            or_(Fixture.home_team_id == team_id, Fixture.away_team_id == team_id)
        )
    if resolved_bucket is None and status and status not in ("upcoming", "finished", "live"):
        conditions.append(Fixture.status == status)
    if conditions:
        stmt = stmt.where(and_(*conditions))

    result = await db.execute(stmt)
    fixtures = list(result.scalars().all())

    if resolved_bucket:
        fixtures = _filter_by_bucket(fixtures, resolved_bucket, now_ist())
    elif status == "upcoming":
        fixtures = _filter_by_bucket(fixtures, "upcoming", now_ist())
    else:
        fixtures.sort(key=lambda f: f.kickoff_ist)

    fixtures = fixtures[:limit]

    responses = []
    for f in fixtures:
        home = await db.execute(select(Team).where(Team.id == f.home_team_id))
        away = await db.execute(select(Team).where(Team.id == f.away_team_id))
        responses.append(
            _build_match_from_fixture(f, home.scalar_one(), away.scalar_one())
        )
    return responses


@router.get("/{match_id}", response_model=MatchResponse)
async def get_match(
    match_id: int,
    db: AsyncSession = Depends(get_db),
) -> MatchResponse:
    stmt = select(Fixture).where(Fixture.id == match_id)
    result = await db.execute(stmt)
    fixture = result.scalar_one_or_none()
    if not fixture:
        raise HTTPException(status_code=404, detail="Match not found")

    home = await db.execute(select(Team).where(Team.id == fixture.home_team_id))
    away = await db.execute(select(Team).where(Team.id == fixture.away_team_id))
    home_team = home.scalar_one_or_none()
    away_team = away.scalar_one_or_none()

    await sync_events_if_needed(db, fixture)

    response = _build_match_from_fixture(fixture, home_team, away_team)

    events_stmt = select(MatchEvent).where(MatchEvent.fixture_id == fixture.id)
    events_result = await db.execute(events_stmt)
    db_events = list(events_result.scalars().all())

    response.events = [_build_event(ev, fixture) for ev in db_events]
    response.statistics = []

    return response
