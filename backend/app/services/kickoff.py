from datetime import UTC, datetime
from zoneinfo import ZoneInfo

IST = ZoneInfo("Asia/Kolkata")
US_EASTERN = ZoneInfo("America/New_York")


def parse_kickoff_ist(match: dict) -> datetime:
    """Parse Zafronix match kickoff and return a timezone-aware datetime in IST."""
    kickoff_utc_str = match.get("kickoffUtc") or match.get("kickoff_utc")
    if kickoff_utc_str:
        try:
            dt = datetime.fromisoformat(str(kickoff_utc_str).replace("Z", "+00:00"))
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=UTC)
            return dt.astimezone(IST)
        except (ValueError, TypeError):
            pass

    date_str = match.get("date", "")
    kickoff_str = match.get("kickoff", "00:00")
    try:
        naive = datetime.fromisoformat(f"{date_str}T{kickoff_str}:00")
        local = naive.replace(tzinfo=US_EASTERN)
        return local.astimezone(IST)
    except (ValueError, TypeError):
        return datetime.now(IST)


def now_ist() -> datetime:
    return datetime.now(IST)
