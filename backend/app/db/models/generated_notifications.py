# ruff: noqa: F821
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.models import Base


class GeneratedNotification(Base):
    __tablename__ = "generated_notifications"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    fixture_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("fixtures.id"), nullable=True
    )
    event_type: Mapped[str] = mapped_column(Text, nullable=False)
    notification_type: Mapped[str] = mapped_column(Text, nullable=False)
    reminder_offset: Mapped[str | None] = mapped_column(Text, nullable=True)
    title: Mapped[str] = mapped_column(Text, nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    generated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    fixture: Mapped["Fixture"] = relationship(
        "Fixture", back_populates="generated_notifications"
    )
    user_notifications: Mapped[list["UserNotification"]] = relationship(
        "UserNotification",
        back_populates="generated_notification",
        cascade="all, delete-orphan",
    )

    __table_args__ = ()
