from pydantic import BaseModel


class TeamResponse(BaseModel):
    id: int
    name: str
    code: str = ""
    group: str = ""
    logo_url: str | None = None
    emoji: str | None = None

    model_config = {"from_attributes": True}


class StandingInfo(BaseModel):
    position: int
    played: int
    won: int
    drawn: int
    lost: int
    points: int
    goals_for: int = 0
    goals_against: int = 0


class StandingEntry(BaseModel):
    position: int
    team: TeamResponse
    played: int
    won: int
    drawn: int
    lost: int
    points: int
    goals_for: int = 0
    goals_against: int = 0


class MatchSummary(BaseModel):
    id: int
    home_team: TeamResponse
    away_team: TeamResponse
    home_score: int | None = None
    away_score: int | None = None
    status: str
    stage: str = ""
    datetime: str = ""
    venue: str = ""


class TeamDetailResponse(BaseModel):
    id: int
    name: str
    code: str = ""
    group: str = ""
    logo_url: str | None = None
    emoji: str | None = None
    standing: StandingInfo | None = None
    next_fixture: MatchSummary | None = None
    live_fixture: MatchSummary | None = None
    fixture_coverage: dict | None = None
