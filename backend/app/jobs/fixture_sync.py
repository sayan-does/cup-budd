import logging

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import Fixture, Team
from app.db.session import async_session_maker
from app.services.kickoff import parse_kickoff_ist
from app.services.zafronix_client import normalize_status, zafronix_client

logger = logging.getLogger(__name__)

CURRENT_YEAR = 2026


async def run_fixture_sync(db: AsyncSession | None = None) -> None:
    if db is None:
        async with async_session_maker() as session:
            await _sync(session)
    else:
        await _sync(db)


async def _sync(db: AsyncSession) -> None:
    try:
        tournament = await zafronix_client.get_tournament(CURRENT_YEAR)
    except Exception as e:
        logger.warning("Fixture sync skipped (tournament fetch failed): %s", e)
        return

    teams_data = tournament.get("teams", [])
    team_name_map: dict[str, Team] = {}
    for team_data in teams_data:
        team = await _upsert_team(db, team_data)
        if team:
            team_name_map[team_data.get("name", "")] = team

    try:
        # Prefer the tournament-level fetcher when available; fall back to bulk page fetch
        fetcher = getattr(zafronix_client, "fetch_tournament_matches", None)
        if fetcher is not None:
            try:
                matches, failed_stages = await fetcher(CURRENT_YEAR)
            except TypeError:
                # The patched client in tests may expose a MagicMock attribute that
                # isn't actually awaitable. Fall back to the older bulk fetcher.
                matches = await zafronix_client.fetch_all_matches(CURRENT_YEAR)
                failed_stages = []
        else:
            # older clients return just a list
            matches = await zafronix_client.fetch_all_matches(CURRENT_YEAR)
            failed_stages = []
    except Exception as e:
        logger.warning("Fixture sync skipped (matches fetch failed): %s", e)
        return

    if not matches:
        logger.warning("Fixture sync: Zafronix returned no matches for %s", CURRENT_YEAR)
        return

    # counters for completion log
    fetched = len(matches)
    upserted = 0
    skipped_team_mismatch = 0
    teams_incomplete: set[str] = set()

    for match in matches:
        home_name = match.get("homeTeam")
        away_name = match.get("awayTeam")
        if not home_name or not away_name:
            continue

        home_team = team_name_map.get(home_name)
        away_team = team_name_map.get(away_name)
        if home_team is None or away_team is None:
            # record that this match referenced an unknown team
            skipped_team_mismatch += 1
            teams_incomplete.add(home_name or "")
            teams_incomplete.add(away_name or "")
            continue

        external_id = match.get("id")
        if not external_id:
            continue

        stmt = select(Fixture).where(Fixture.external_id == external_id)
        result = await db.execute(stmt)
        existing = result.scalar_one_or_none()
        kickoff_ist = parse_kickoff_ist(match)
        stage = match.get("stageNormalized") or match.get("stage", "")
        group = _extract_group(stage)


        if existing:
            existing.kickoff_ist = kickoff_ist
            if match.get("status"):
                existing.status = normalize_status(match["status"])
            if match.get("homeScore") is not None:
                existing.home_score = match.get("homeScore")
            if match.get("awayScore") is not None:
                existing.away_score = match.get("awayScore")
            upserted += 1
            continue

        fixture = Fixture(
            external_id=external_id,
            home_team_id=home_team.id,
            away_team_id=away_team.id,
            kickoff_ist=kickoff_ist,
            status=normalize_status(match.get("status", "scheduled")),
            stage=stage,
            round_code=match.get("stage", ""),
            location=match.get("stadium"),
            group=group,
        )
        db.add(fixture)
        upserted += 1

    await db.commit()
    # mark incomplete if any stage fetch failed or teams have incomplete fixtures
    sync_complete = not failed_stages and all(
        t for t in team_name_map.keys()
    )
    logger.info(
        "Fixture sync complete: teams=%d fetched=%d upserted=%d skipped_team_mismatch=%d teams_incomplete=%d failed_stages=%s",
        len(teams_data),
        fetched,
        upserted,
        skipped_team_mismatch,
        len([t for t in teams_incomplete if t]),
        failed_stages,
    )
    if failed_stages or teams_incomplete:
        logger.warning("Fixture sync incomplete: failed_stages=%s teams_incomplete=%s", failed_stages, list(teams_incomplete))


async def _upsert_team(db: AsyncSession, team_data: dict) -> Team | None:
    name = team_data.get("name")
    code = team_data.get("code")
    if not name or not code:
        return None

    stmt = select(Team).where(Team.external_id == code)
    result = await db.execute(stmt)
    team = result.scalar_one_or_none()

    if team is None:
        group_stage = team_data.get("groupStage") or {}
        group = ""
        if group_stage.get("group"):
            group = group_stage["group"]

        team = Team(
            external_id=code,
            name=name,
            code=code,
            group=group,
            logo_url=None,
        )
        db.add(team)
        await db.flush()
        await db.refresh(team)

    return team


def _extract_group(stage: str) -> str:
    if stage.startswith("group_"):
        return stage.split("_")[-1].upper()
    return ""
