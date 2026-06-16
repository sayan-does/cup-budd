# ruff: noqa: F821
import uuid
from datetime import datetime

from sqlalchemy import UUID, DateTime, ForeignKey, Index, Integer, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.models import Base


class UserNotification(Base):
    __tablename__ = "user_notifications"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    generated_notification_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("generated_notifications.id"), nullable=False
    )
    status: Mapped[str] = mapped_column(Text, nullable=False, default="pending")
    sent_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)

    user: Mapped["User"] = relationship("User", back_populates="user_notifications")
    generated_notification: Mapped["GeneratedNotification"] = relationship(
        "GeneratedNotification", back_populates="user_notifications"
    )


Index("idx_user_notifications_user", UserNotification.user_id)
Index("idx_user_notifications_status", UserNotification.status)
