from datetime import datetime, timedelta

import pytest

from app.db.models import Fixture
from app.services.kickoff import IST, parse_kickoff_ist
from app.services.match_buckets import classify_bucket


def _fixture(status: str, kickoff: datetime) -> Fixture:
    return Fixture(
        external_id="test-1",
        home_team_id=1,
        away_team_id=2,
        kickoff_ist=kickoff,
        status=status,
    )


class TestParseKickoffIst:
    def test_kickoff_utc_converts_to_ist(self):
        match = {"kickoffUtc": "2026-06-15T23:00:00Z"}
        dt = parse_kickoff_ist(match)
        assert dt.tzinfo == IST
        assert dt.hour == 4
        assert dt.day == 16

    def test_us_eastern_local_converts_to_ist(self):
        match = {"date": "2026-06-15", "kickoff": "19:00"}
        dt = parse_kickoff_ist(match)
        assert dt.tzinfo == IST
        assert dt.day == 16
        assert dt.hour == 4
        assert dt.minute == 30


class TestClassifyBucket:
    def test_finished_is_past(self):
        kickoff = datetime(2026, 6, 15, 19, 0, tzinfo=IST)
        now = kickoff + timedelta(hours=1)
        assert classify_bucket(_fixture("finished", kickoff), now) == "past"

    def test_scheduled_before_kickoff_is_upcoming(self):
        kickoff = datetime(2026, 6, 15, 19, 0, tzinfo=IST)
        now = kickoff - timedelta(hours=1)
        assert classify_bucket(_fixture("scheduled", kickoff), now) == "upcoming"

    def test_scheduled_during_window_is_live(self):
        kickoff = datetime(2026, 6, 15, 19, 0, tzinfo=IST)
        now = kickoff + timedelta(minutes=30)
        assert classify_bucket(_fixture("scheduled", kickoff), now) == "live"

    def test_scheduled_after_two_hours_is_past(self):
        kickoff = datetime(2026, 6, 15, 19, 0, tzinfo=IST)
        now = kickoff + timedelta(hours=2)
        assert classify_bucket(_fixture("scheduled", kickoff), now) == "past"

    def test_live_status_is_live(self):
        kickoff = datetime(2026, 6, 15, 19, 0, tzinfo=IST)
        now = kickoff + timedelta(minutes=10)
        assert classify_bucket(_fixture("live", kickoff), now) == "live"

    def test_live_after_two_hours_is_past(self):
        kickoff = datetime(2026, 6, 15, 19, 0, tzinfo=IST)
        now = kickoff + timedelta(hours=2, minutes=1)
        assert classify_bucket(_fixture("live", kickoff), now) == "past"
