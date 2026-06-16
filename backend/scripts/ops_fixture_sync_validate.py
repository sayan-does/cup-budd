#!/usr/bin/env python3
"""Ops script: fixture sync + IST kickoff validation against Zafronix."""

from __future__ import annotations

import asyncio
import sys

from sqlalchemy import select

from app.db.models import Fixture, Team
from app.db.session import async_session_maker
from app.jobs.fixture_sync import run_fixture_sync
from app.services.kickoff import IST, now_ist, parse_kickoff_ist
from app.services.match_buckets import classify_bucket
from app.services.zafronix_client import zafronix_client


async def _validate_sample_fixtures(db, limit: int = 3) -> bool:
    result = await db.execute(select(Fixture).order_by(Fixture.kickoff_ist).limit(limit))
    fixtures = list(result.scalars().all())
    if not fixtures:
        print("No fixtures in DB to validate.")
        return False

    ok = True
    print(f"\nValidating {len(fixtures)} fixture(s) against Zafronix -> IST:\n")
    for fixture in fixtures:
        try:
            raw = await zafronix_client.get_match(fixture.external_id)
        except Exception as exc:
            print(f"  FAIL {fixture.external_id}: Zafronix fetch failed ({exc})")
            ok = False
            continue

        expected = parse_kickoff_ist(raw)
        stored = fixture.kickoff_ist.astimezone(IST) if fixture.kickoff_ist.tzinfo else fixture.kickoff_ist.replace(tzinfo=IST)
        delta_sec = abs((stored - expected).total_seconds()) if expected else 999999
        match = delta_sec < 60
        status = "OK" if match else "MISMATCH"
        print(
            f"  [{status}] {fixture.external_id} | DB={stored.isoformat()} | "
            f"Zafronix={expected.isoformat() if expected else 'n/a'} | delta={int(delta_sec)}s"
        )
        if not match:
            ok = False

    return ok


async def _validate_upcoming_bucket(db) -> bool:
    now = now_ist()
    result = await db.execute(select(Fixture))
    fixtures = list(result.scalars().all())
    upcoming = [f for f in fixtures if classify_bucket(f, now) == "upcoming"]
    stale = [
        f
        for f in upcoming
        if (f.kickoff_ist.astimezone(IST) if f.kickoff_ist.tzinfo else f.kickoff_ist.replace(tzinfo=IST)) < now
    ]
    print(f"\nUpcoming bucket: {len(upcoming)} fixtures; stale kickoffs: {len(stale)}")
    if stale:
        for f in stale[:5]:
            print(f"  STALE {f.external_id} kickoff={f.kickoff_ist} status={f.status}")
        return False
    print("  OK — no past kickoffs in upcoming bucket")
    return True


async def _validate_team_next_fixture(db) -> bool:
    from app.api.v1.teams import get_team

    team_result = await db.execute(select(Team).limit(1))
    team = team_result.scalar_one_or_none()
    if not team:
        print("\nNo teams in DB — skipping next_fixture check.")
        return True

    detail = await get_team(team.id, db)
    if not detail.next_fixture:
        print(f"\nTeam {team.name} has no next_fixture (may be normal).")
        return True

    fixture = (
        await db.execute(select(Fixture).where(Fixture.id == detail.next_fixture.id))
    ).scalar_one_or_none()
    if not fixture:
        print(f"\nWARN: next_fixture id={detail.next_fixture.id} not found in DB")
        return False

    bucket = classify_bucket(fixture, now_ist())
    ok = bucket == "upcoming"
    print(f"\nTeam {team.name} next_fixture id={fixture.id} classify_bucket={bucket}")
    return ok


async def main() -> int:
    print("=== Cup Budd ops: fixture sync + validation ===\n")

    print("1) Running fixture sync from Zafronix...")
    async with async_session_maker() as db:
        await run_fixture_sync(db)

    async with async_session_maker() as db:
        fixtures = list((await db.execute(select(Fixture))).scalars().all())
        print(f"   Fixture sync complete. Fixtures in DB: {len(fixtures)}")

        # New completeness checks
        total_fixtures = len(fixtures)
        print(f"   Total fixtures in DB: {total_fixtures}")

        # FAIL if total fixtures < 48 (group-stage minimum)
        if total_fixtures < 48:
            print("FAIL: total fixtures < 48 — incomplete ingestion")
            overall_ok = False
        else:
            overall_ok = True

        sample_ok = await _validate_sample_fixtures(db)
        bucket_ok = await _validate_upcoming_bucket(db)
        team_ok = await _validate_team_next_fixture(db)

        # Per-team coverage checks
        print("\nChecking per-team fixture coverage:")
        teams = list((await db.execute(select(Team))).scalars().all())
        teams_with_zero = []
        teams_partial = []
        teams_no_upcoming_and_incomplete = []
        now = now_ist()
        for team in teams:
            stmt = select(Fixture).where(
                (Fixture.home_team_id == team.id) | (Fixture.away_team_id == team.id)
            )
            team_fixtures = list((await db.execute(stmt)).scalars().all())
            group_fixtures = len([f for f in team_fixtures if f.group and f.group.upper() == (team.group or "").upper()])
            expected = 3 if team.group else 0
            if expected > 0 and len(team_fixtures) == 0:
                teams_with_zero.append(team.name)
            if expected > 0 and group_fixtures < expected:
                teams_partial.append((team.name, group_fixtures))
            has_upcoming = any(classify_bucket(f, now) == "upcoming" for f in team_fixtures)
            sync_complete = group_fixtures >= expected if expected > 0 else True
            if not has_upcoming and not sync_complete:
                teams_no_upcoming_and_incomplete.append(team.name)

        if teams_with_zero:
            print("FAIL: teams with 0 fixtures:")
            for t in teams_with_zero:
                print("  ", t)
            overall_ok = False

        if teams_partial:
            print("WARN: teams with partial group fixtures:")
            for t, c in teams_partial:
                print(f"  {t}: group_fixtures={c}")

        if teams_no_upcoming_and_incomplete:
            print("WARN: teams with no upcoming match and incomplete sync:")
            for t in teams_no_upcoming_and_incomplete:
                print("  ", t)

    await zafronix_client.close()

    all_ok = overall_ok and sample_ok and bucket_ok and team_ok
    print("\n=== Summary ===")
    print("RESULT:", "PASS" if all_ok else "FAIL")
    return 0 if all_ok else 1


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
