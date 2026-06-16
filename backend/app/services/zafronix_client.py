import asyncio
from contextlib import suppress
from datetime import datetime

import httpx
from httpx import AsyncClient

from app.config import settings
from app.services.kickoff import parse_kickoff_ist


class ZafronixAPIError(Exception):
    def __init__(
        self, message: str, status_code: int = 0, error: str = "", request_id: str = ""
    ) -> None:
        self.message = message
        self.status_code = status_code
        self.error = error
        self.request_id = request_id
        super().__init__(message)


# ---- pure helpers (no network; easy to unit-test) ----

STATUS_MAP = {
    "scheduled": "scheduled", "not_started": "scheduled",
    "live": "live", "halftime": "live",
    "finished": "finished", "final": "finished",
    "postponed": "postponed", "abandoned": "postponed", "cancelled": "postponed",
}

STAGE_MAP: dict[str, str] = {
    "round_of_32": "round_of_32", "r32": "round_of_32",
    "round_of_16": "round_of_16", "r16": "round_of_16",
    "quarter_final": "quarter_final", "qf": "quarter_final",
    "semi_final": "semi_final", "sf": "semi_final",
    "third_place": "third_place", "thirdPlace": "third_place",
    "final": "final",
}


def normalize_status(raw: str) -> str:
    return STATUS_MAP.get(raw.lower(), "scheduled")


def normalize_stage(stage: str, stage_normalized: str | None = None) -> str:
    raw = stage_normalized or stage
    if raw.startswith("group_"):
        return "group"
    return STAGE_MAP.get(raw, "group")


def parse_kickoff_utc(
    date: str, kickoff: str, kickoff_utc: str | None = None
) -> datetime | None:
    """Deprecated alias — returns IST-aware datetime."""
    match: dict = {"date": date, "kickoff": kickoff}
    if kickoff_utc:
        match["kickoffUtc"] = kickoff_utc
    return parse_kickoff_ist(match)


# ---- network client ----

class ZafronixClient:
    def __init__(self) -> None:
        self.base_url = settings.zafronix_api_base_url
        self.api_key = settings.zafronix_api_key
        self._client: AsyncClient | None = None

    async def _get_client(self) -> AsyncClient:
        if self._client is None:
            self._client = AsyncClient(
                base_url=self.base_url,
                headers={"X-API-Key": self.api_key},
                timeout=30.0,
            )
        return self._client

    async def _request(
        self, method: str, path: str, params: dict | None = None, json_data: dict | None = None
    ) -> dict | list:
        client = await self._get_client()
        for attempt in (1, 2):
            try:
                response = await client.request(method, path, params=params, json=json_data)
                if response.status_code == 429:
                    retry_after = int(response.headers.get("Retry-After", "5"))
                    await asyncio.sleep(retry_after)
                    continue
                response.raise_for_status()
                return response.json()
            except httpx.TimeoutException as exc:
                if attempt == 2:
                    raise ZafronixAPIError(str(exc), status_code=0) from exc
                await asyncio.sleep(5)
            except httpx.HTTPStatusError as exc:
                body = {}
                with suppress(Exception):
                    body = exc.response.json()
                raise ZafronixAPIError(
                    message=body.get("message", str(exc)),
                    status_code=exc.response.status_code,
                    error=body.get("error", ""),
                    request_id=body.get("request_id", ""),
                ) from exc
        return {}

    async def get_health(self) -> dict:
        return await self._request("GET", "/health")

    async def get_tournaments(self) -> list[dict]:
        result = await self._request("GET", "/tournaments")
        return result if isinstance(result, list) else []

    async def get_tournament(self, year: int) -> dict:
        result = await self._request("GET", f"/tournaments/{year}")
        return result if isinstance(result, dict) else {}

    async def get_teams(self, tournament: int | None = None, country: str | None = None) -> list[dict]:
        params: dict = {}
        if tournament is not None:
            params["tournament"] = tournament
        if country is not None:
            params["country"] = country
        result = await self._request("GET", "/teams", params=params)
        return result if isinstance(result, list) else []

    async def get_team(self, name: str) -> dict:
        from urllib.parse import quote
        result = await self._request("GET", f"/teams/{quote(name)}")
        return result if isinstance(result, dict) else {}

    async def get_team_roster(self, team_name: str, year: int) -> list[dict]:
        from urllib.parse import quote
        result = await self._request("GET", f"/teams/{quote(team_name)}/roster", params={"year": year})
        return result if isinstance(result, list) else []

    async def get_matches(
        self,
        year: int,
        stage: str | None = None,
        team: str | None = None,
        limit: int | None = None,
        cursor: str | None = None,
    ) -> dict:
        params: dict = {"year": year}
        if stage:
            params["stage"] = stage
        if team:
            params["team"] = team
        if limit:
            params["limit"] = limit
        if cursor:
            params["cursor"] = cursor
        result = await self._request("GET", "/matches", params=params)
        return result if isinstance(result, dict) else {}

    async def fetch_all_matches(
        self,
        year: int,
        *,
        stage: str | None = None,
        team: str | None = None,
        page_limit: int = 500,
    ) -> list[dict]:
        """Fetch every match page for a tournament year (Zafronix default page size is 50)."""
        matches: list[dict] = []
        cursor: str | None = None
        while True:
            result = await self.get_matches(
                year, stage=stage, team=team, limit=page_limit, cursor=cursor
            )
            page = result.get("data", [])
            if isinstance(page, list):
                matches.extend(page)

            pagination = result.get("pagination") or {}
            if not pagination.get("hasMore"):
                break
            next_cursor = pagination.get("nextCursor")
            if not next_cursor or next_cursor == cursor:
                break
            cursor = next_cursor

        return matches

    async def fetch_tournament_matches(self, year: int) -> tuple[list[dict], list[str]]:
        """Fetch a tournament's matches thoroughly.

        Returns (matches, failed_stages). `failed_stages` lists any per-stage fetches
        that failed — callers should treat a non-empty list as a partial/incomplete sync.
        """
        # Start with the bulk fetch (may be limited to first N by provider)
        matches_map: dict[str, dict] = {}
        try:
            bulk = await self.fetch_all_matches(year, page_limit=500)
        except Exception:
            bulk = []

        for m in bulk:
            mid = m.get("id")
            if mid:
                matches_map[mid] = m

        # Stage-partitioned supplemental fetches (group + knockout partitions)
        stages = [
            # groups A..L
            *[f"group_{c}" for c in [
                "a","b","c","d","e","f","g","h","i","j","k","l"
            ]],
            # knockout
            "r32",
            "r16",
            "qf",
            "sf",
            "thirdPlace",
            "final",
        ]

        failed_stages: list[str] = []
        for stage in stages:
            try:
                page = await self.fetch_all_matches(year, stage=stage, page_limit=500)
                for m in page:
                    mid = m.get("id")
                    if mid:
                        matches_map[mid] = m
            except Exception:
                # tolerate single-stage failures; report them to the caller
                failed_stages.append(stage)

        return list(matches_map.values()), failed_stages

    async def get_match(self, match_id: str, denormalize: bool = False) -> dict:
        params = {}
        if denormalize:
            params["denormalize"] = "true"
        result = await self._request("GET", f"/matches/{match_id}", params=params)
        return result if isinstance(result, dict) else {}

    async def get_standings(self, year: int, group: str) -> dict:
        result = await self._request("GET", "/standings", params={"year": year, "group": group})
        return result if isinstance(result, dict) else {}

    async def get_live_matches(self) -> list[dict]:
        try:
            result = await self._request("GET", "/matches/live")
            if isinstance(result, dict):
                return result.get("data", [])
            return []
        except ZafronixAPIError as exc:
            if exc.status_code == 402:
                return []
            raise

    async def get_search(self, query: str, types: str | None = None, limit: int = 25) -> dict:
        params = {"q": query, "limit": limit}
        if types:
            params["types"] = types
        result = await self._request("GET", "/search", params=params)
        return result if isinstance(result, dict) else {}

    async def get_usage(self) -> dict:
        result = await self._request("GET", "/me/usage")
        return result if isinstance(result, dict) else {}

    async def close(self) -> None:
        if self._client:
            await self._client.aclose()
            self._client = None


zafronix_client = ZafronixClient()
