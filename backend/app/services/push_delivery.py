from datetime import UTC, datetime

from pywebpush import WebPushException, webpush
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.db.models import GeneratedNotification, User, UserNotification


async def send_notification_to_user(
    db: AsyncSession,
    user: User,
    notification: GeneratedNotification,
    fixture_id: int,
) -> None:
    payload = {
        "title": notification.title,
        "body": notification.body,
        "icon": "/icons/notification-192.png",
        "badge": "/icons/badge-72.png",
        "data": {
            "url": f"/match/{fixture_id}",
            "fixture_id": fixture_id,
        },
    }

    subscription = {
        "endpoint": user.push_endpoint,
        "keys": {
            "p256dh": user.push_p256dh,
            "auth": user.push_auth,
        },
    }

    if not all([user.push_endpoint, user.push_p256dh, user.push_auth]):
        return

    user_notification = UserNotification(
        user_id=user.id,
        generated_notification_id=notification.id,
        status="pending",
    )
    db.add(user_notification)

    try:
        webpush(
            subscription_info=subscription,
            data=str(payload),
            vapid_private_key=settings.vapid_private_key,
            vapid_claims={"sub": settings.vapid_claims_email},
        )
        user_notification.status = "sent"
        user_notification.sent_at = datetime.now(UTC)
    except WebPushException as exc:
        if exc.response and exc.response.status_code in (404, 410):
            user.push_endpoint = None
            user.push_p256dh = None
            user.push_auth = None
        user_notification.status = "failed"
        user_notification.error_message = str(exc)

    await db.commit()


async def fan_out_notification(
    db: AsyncSession,
    notification: GeneratedNotification,
    users: list[User],
    fixture_id: int,
) -> None:
    for user in users:
        if not user.push_endpoint:
            continue
        await send_notification_to_user(db, user, notification, fixture_id)


async def create_and_fan_out(
    db: AsyncSession,
    fixture_id: int,
    event_type: str,
    notification_type: str,
    reminder_offset: str | None,
    title: str,
    body: str,
    users: list[User],
) -> GeneratedNotification:
    existing = await _get_existing_notification(
        db, fixture_id, event_type, notification_type, reminder_offset
    )
    if existing:
        await fan_out_notification(db, existing, users, fixture_id)
        return existing

    notification = GeneratedNotification(
        fixture_id=fixture_id,
        event_type=event_type,
        notification_type=notification_type,
        reminder_offset=reminder_offset,
        title=title,
        body=body,
    )
    db.add(notification)
    await db.flush()

    await fan_out_notification(db, notification, users, fixture_id)
    return notification


async def _get_existing_notification(
    db: AsyncSession,
    fixture_id: int,
    event_type: str,
    notification_type: str,
    reminder_offset: str | None,
) -> GeneratedNotification | None:
    from sqlalchemy import and_
    stmt = select(GeneratedNotification).where(
        and_(
            GeneratedNotification.fixture_id == fixture_id,
            GeneratedNotification.event_type == event_type,
            GeneratedNotification.notification_type == notification_type,
            GeneratedNotification.reminder_offset == reminder_offset,
        )
    )
    result = await db.execute(stmt)
    return result.scalar_one_or_none()
