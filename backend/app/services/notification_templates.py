from pathlib import Path

from jinja2 import Environment, FileSystemLoader

from app.services.cache import redis_cache
from app.services.zafronix_client import zafronix_client

TEMPLATE_DIR = Path(__file__).resolve().parent.parent / "templates" / "notifications"

env = Environment(
    loader=FileSystemLoader(str(TEMPLATE_DIR)),
    autoescape=False,
)


async def get_standings_context(group: str) -> dict | None:
    cache_key = f"standings:group:{group}"
    cached = await redis_cache.get(cache_key)
    if cached:
        return cached
    standings_data = await zafronix_client.get_standings(2026, group)
    standings = _parse_standings(standings_data, group)
    if standings:
        await redis_cache.set(cache_key, {"standings": standings}, ttl=300)
    return {"standings": standings}


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


def _get_team_info(
    team_name: str, standings_data: dict | None
) -> dict | None:
    if not standings_data:
        return None
    for team in standings_data.get("standings", []):
        name = team.get("name") or team.get("team")
        if name == team_name:
            return {
                "position": team.get("position"),
                "points": team.get("points"),
                "form": team.get("form"),
            }
    return None


def _render(template_name: str, context: dict) -> dict:
    template = env.get_template(template_name)
    text = template.render(context)
    lines = text.strip().split("\n", 1)
    title = lines[0].strip()
    body = lines[1].strip() if len(lines) > 1 else ""
    return {"title": title, "body": body}


async def render_goal_alert(
    team_name: str,
    opponent_name: str,
    minute: int,
    home_score: int,
    away_score: int,
    group: str,
) -> dict:
    standings_data = await get_standings_context(group)
    info = _get_team_info(team_name, standings_data)
    context = {
        "team_name": team_name,
        "opponent_name": opponent_name,
        "minute": minute,
        "home_score": home_score,
        "away_score": away_score,
        "group": group,
        "standing_position": info["position"] if info else None,
        "standing_points": info["points"] if info else None,
    }
    return _render("goal_alert.j2", context)


async def render_result_summary(
    home_team_name: str,
    away_team_name: str,
    home_score: int,
    away_score: int,
    group: str,
) -> dict:
    standings_data = await get_standings_context(group)
    home_info = _get_team_info(home_team_name, standings_data)
    away_info = _get_team_info(away_team_name, standings_data)
    winner = home_team_name if home_score >= away_score else away_team_name
    info = home_info if winner == home_team_name else away_info
    context = {
        "home_team_name": home_team_name,
        "away_team_name": away_team_name,
        "home_score": home_score,
        "away_score": away_score,
        "group": group,
        "winner": winner,
        "home_standing_position": info["position"] if info else None,
        "home_standing_points": info["points"] if info else None,
        "home_form": info["form"] if info else [],
    }
    return _render("result_summary.j2", context)


async def render_match_reminder(
    team_name: str,
    opponent_name: str,
    group: str,
    reminder_offset: str,
    kickoff_local: str,
) -> dict:
    standings_data = await get_standings_context(group)
    info = _get_team_info(team_name, standings_data)
    context = {
        "team_name": team_name,
        "opponent_name": opponent_name,
        "group": group,
        "reminder_offset": reminder_offset,
        "kickoff_local": kickoff_local,
        "standing_position": info["position"] if info else None,
        "standing_points": info["points"] if info else None,
    }
    template_name = f"match_reminder_{reminder_offset}.j2"
    return _render(template_name, context)
