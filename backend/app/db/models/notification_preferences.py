# ruff: noqa: F821
import uuid

from sqlalchemy import UUID, Boolean, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.models import Base


class NotificationPreference(Base):
    __tablename__ = "notification_preferences"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True,
    )
    match_reminders: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True
    )
    goal_alerts: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    result_summaries: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True
    )
    qualification_alerts: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True
    )
    daily_digest: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    user: Mapped["User"] = relationship(
        "User", back_populates="notification_preferences"
    )
