
from pydantic import BaseModel


class MatchEventResponse(BaseModel):
    minute: int | None = None
    type: str = ""
    player: str | None = None
    team: str = ""


class MatchStat(BaseModel):
    label: str
    home: float = 0
    away: float = 0


class TeamSummary(BaseModel):
    id: int
    name: str
    code: str = ""
    logo_url: str | None = None
    emoji: str | None = None


class MatchResponse(BaseModel):
    id: int
    home_team: TeamSummary
    away_team: TeamSummary
    home_score: int | None = None
    away_score: int | None = None
    status: str
    stage: str = ""
    datetime: str = ""
    venue: str = ""
    events: list[MatchEventResponse] = []
    statistics: list[MatchStat] = []
