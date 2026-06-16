import uuid

from pydantic import BaseModel, Field


class UserPreferences(BaseModel):
    match_reminders: bool = True
    goal_alerts: bool = True
    result_summaries: bool = True


class UserCreate(BaseModel):
    email: str = Field(max_length=254)
    name: str | None = None
    favorite_team_id: int | None = None
    timezone: str = "UTC"
    preferences: UserPreferences | None = None


class UserResponse(BaseModel):
    id: uuid.UUID
    email: str
    favorite_team_id: int | None = None
    favorite_team_name: str | None = None
    favorite_team_logo_url: str | None = None
    timezone: str
    preferences: UserPreferences | None = None
    push_enabled: bool = False


class UserUpdateTeam(BaseModel):
    favorite_team_id: int


class UserUpdatePreferences(BaseModel):
    match_reminders: bool | None = None
    goal_alerts: bool | None = None
    result_summaries: bool | None = None


class PushSubscriptionKeys(BaseModel):
    p256dh: str
    auth: str


class PushSubscription(BaseModel):
    endpoint: str
    keys: PushSubscriptionKeys
