# ruff: noqa: E402
from __future__ import annotations

from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass


from app.db.models.fixtures import Fixture
from app.db.models.generated_notifications import GeneratedNotification
from app.db.models.match_events import MatchEvent
from app.db.models.notification_preferences import NotificationPreference
from app.db.models.reminder_dispatches import ReminderDispatch
from app.db.models.teams import Team
from app.db.models.user_notifications import UserNotification
from app.db.models.users import User

__all__ = [
    "Base",
    "Team",
    "User",
    "NotificationPreference",
    "Fixture",
    "MatchEvent",
    "GeneratedNotification",
    "UserNotification",
    "ReminderDispatch",
]
