from app.db.models import Base


def test_base_exists():
    assert Base is not None


def test_all_models_importable():
    from app.db.models import (
        Fixture,
        GeneratedNotification,
        MatchEvent,
        NotificationPreference,
        ReminderDispatch,
        Team,
        User,
        UserNotification,
    )
    assert Team is not None
    assert User is not None
    assert NotificationPreference is not None
    assert Fixture is not None
    assert MatchEvent is not None
    assert GeneratedNotification is not None
    assert UserNotification is not None
    assert ReminderDispatch is not None


def test_team_model_columns():
    from app.db.models import Team
    assert hasattr(Team, "id")
    assert hasattr(Team, "external_id")
    assert hasattr(Team, "name")
    assert hasattr(Team, "code")
    assert hasattr(Team, "group")
    assert hasattr(Team, "logo_url")


def test_user_model_columns():
    from app.db.models import User
    assert hasattr(User, "id")
    assert hasattr(User, "email")
    assert hasattr(User, "name")
    assert hasattr(User, "favorite_team_id")
    assert hasattr(User, "timezone")
    assert hasattr(User, "push_endpoint")
    assert hasattr(User, "onboarding_complete")
    assert hasattr(User, "created_at")
    assert hasattr(User, "updated_at")


def test_notification_preferences_model_columns():
    from app.db.models import NotificationPreference
    assert hasattr(NotificationPreference, "user_id")
    assert hasattr(NotificationPreference, "match_reminders")
    assert hasattr(NotificationPreference, "goal_alerts")
    assert hasattr(NotificationPreference, "result_summaries")


def test_fixture_model_columns():
    from app.db.models import Fixture
    assert hasattr(Fixture, "id")
    assert hasattr(Fixture, "external_id")
    assert hasattr(Fixture, "home_team_id")
    assert hasattr(Fixture, "away_team_id")
    assert hasattr(Fixture, "kickoff_ist")
    assert hasattr(Fixture, "status")
    assert hasattr(Fixture, "home_score")
    assert hasattr(Fixture, "away_score")
    assert hasattr(Fixture, "stage")
    assert hasattr(Fixture, "group")


def test_match_event_model_columns():
    from app.db.models import MatchEvent
    assert hasattr(MatchEvent, "id")
    assert hasattr(MatchEvent, "fixture_id")
    assert hasattr(MatchEvent, "external_id")
    assert hasattr(MatchEvent, "event_type")
    assert hasattr(MatchEvent, "team_id")
    assert hasattr(MatchEvent, "minute")
    assert hasattr(MatchEvent, "payload")


def test_generated_notifications_model_columns():
    from app.db.models import GeneratedNotification
    assert hasattr(GeneratedNotification, "id")
    assert hasattr(GeneratedNotification, "fixture_id")
    assert hasattr(GeneratedNotification, "event_type")
    assert hasattr(GeneratedNotification, "notification_type")
    assert hasattr(GeneratedNotification, "reminder_offset")
    assert hasattr(GeneratedNotification, "title")
    assert hasattr(GeneratedNotification, "body")


def test_user_notifications_model_columns():
    from app.db.models import UserNotification
    assert hasattr(UserNotification, "id")
    assert hasattr(UserNotification, "user_id")
    assert hasattr(UserNotification, "generated_notification_id")
    assert hasattr(UserNotification, "status")
    assert hasattr(UserNotification, "sent_at")
    assert hasattr(UserNotification, "error_message")


def test_reminder_dispatch_model_columns():
    from app.db.models import ReminderDispatch
    assert hasattr(ReminderDispatch, "id")
    assert hasattr(ReminderDispatch, "fixture_id")
    assert hasattr(ReminderDispatch, "reminder_offset")
    assert hasattr(ReminderDispatch, "dispatched_at")
