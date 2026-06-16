import uuid
from datetime import UTC, datetime

import pytest
from pydantic import ValidationError


class TestUserSchemas:
    def test_user_create_valid(self):
        from app.schemas.users import UserCreate
        data = UserCreate(email="test@example.com", name="Test User", timezone="UTC")
        assert data.email == "test@example.com"
        assert data.name == "Test User"
        assert data.timezone == "UTC"

    def test_user_create_minimal(self):
        from app.schemas.users import UserCreate
        data = UserCreate(email="test@example.com")
        assert data.email == "test@example.com"
        assert data.timezone == "UTC"

    def test_user_create_long_email(self):
        from app.schemas.users import UserCreate
        long_email = "a" * 255 + "@test.com"
        with pytest.raises(ValidationError):
            UserCreate(email=long_email)

    def test_user_response_valid(self):
        from app.schemas.users import UserResponse
        data = UserResponse(
            id=uuid.uuid4(),
            email="test@example.com",
            timezone="UTC",
        )
        assert data.email == "test@example.com"
        assert data.push_enabled is False

    def test_user_update_team(self):
        from app.schemas.users import UserUpdateTeam
        data = UserUpdateTeam(favorite_team_id=12)
        assert data.favorite_team_id == 12

    def test_push_subscription(self):
        from app.schemas.users import PushSubscription
        data = PushSubscription(
            endpoint="https://fcm.googleapis.com/fcm/send/xxx",
            keys={"p256dh": "abc123", "auth": "def456"},
        )
        assert data.endpoint.startswith("https://")
        assert data.keys.p256dh == "abc123"


class TestTeamSchemas:
    def test_team_response(self):
        from app.schemas.teams import TeamResponse
        data = TeamResponse(id=1, name="Argentina", code="ARG", group="C")
        assert data.name == "Argentina"
        assert data.code == "ARG"

    def test_team_detail_response(self):
        from app.schemas.teams import StandingInfo, TeamDetailResponse
        standing = StandingInfo(
            position=1, played=2, won=2, drawn=0, lost=0,
            points=6, goals_for=5, goals_against=2, form=["W", "W"],
        )
        data = TeamDetailResponse(id=1, name="Argentina", group="C", standing=standing)
        assert data.standing.position == 1
        assert data.standing.points == 6


class TestMatchSchemas:
    def test_match_response(self):
        from app.schemas.matches import MatchResponse, TeamSummary
        now = datetime.now(UTC)
        data = MatchResponse(
            id=1,
            home_team=TeamSummary(id=12, name="Argentina"),
            away_team=TeamSummary(id=8, name="Spain"),
            datetime=now.isoformat(),
            status="scheduled",
        )
        assert data.status == "scheduled"
        assert data.home_score is None

    def test_match_event_response(self):
        from app.schemas.matches import MatchEventResponse
        data = MatchEventResponse(minute=72, type="goal", player="Messi", team="home")
        assert data.minute == 72
        assert data.type == "goal"

    def test_match_stat(self):
        from app.schemas.matches import MatchStat
        data = MatchStat(label="Possession", home=54, away=46)
        assert data.label == "Possession"
        assert data.home == 54


class TestPushSchema:
    def test_vapid_public_key_response(self):
        from app.schemas.push import VapidPublicKeyResponse
        data = VapidPublicKeyResponse(publicKey="BNcRd...")
        assert data.publicKey == "BNcRd..."


class TestHealthSchema:
    def test_health_response(self):
        from app.schemas.health import HealthResponse
        data = HealthResponse(status="ok", db="ok", redis="ok", scheduler="ok")
        assert data.status == "ok"
