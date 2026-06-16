from datetime import datetime, timedelta
from typing import Literal

from app.db.models import Fixture
from app.services.kickoff import IST, now_ist

LIVE_WINDOW = timedelta(hours=2)
Bucket = Literal["live", "upcoming", "past"]


def _as_ist(dt: datetime) -> datetime:
    if dt.tzinfo is None:
        return dt.replace(tzinfo=IST)
    return dt.astimezone(IST)


def classify_bucket(fixture: Fixture, now: datetime | None = None) -> Bucket:
    now = _as_ist(now or now_ist())
    kickoff = _as_ist(fixture.kickoff_ist)
    end_window = kickoff + LIVE_WINDOW

    if fixture.status == "finished":
        return "past"
    if fixture.status in ("scheduled", "live") and now >= end_window:
        return "past"

    if fixture.status == "live":
        return "live"
    if fixture.status == "scheduled" and kickoff <= now < end_window:
        return "live"

    if fixture.status == "postponed" and now >= kickoff:
        return "past"

    return "upcoming"


def bucket_sort_key(fixture: Fixture, bucket: Bucket) -> datetime:
    kickoff = _as_ist(fixture.kickoff_ist)
    if bucket == "past":
        return kickoff
    return kickoff
