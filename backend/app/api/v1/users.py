from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.v1.deps import get_current_email
from app.db.models import NotificationPreference, User
from app.db.session import get_db
from app.schemas.users import (
    PushSubscription,
    UserCreate,
    UserPreferences,
    UserResponse,
    UserUpdatePreferences,
    UserUpdateTeam,
)

router = APIRouter(prefix="/users", tags=["users"])


def _build_user_response(user: User) -> UserResponse:
    team_name = None
    team_logo_url = None
    if user.favorite_team:
        team_name = user.favorite_team.name
        team_logo_url = user.favorite_team.logo_url

    prefs = None
    if user.notification_preferences:
        prefs = UserPreferences(
            match_reminders=user.notification_preferences.match_reminders,
            goal_alerts=user.notification_preferences.goal_alerts,
            result_summaries=user.notification_preferences.result_summaries,
        )

    return UserResponse(
        id=user.id,
        email=user.email,
        favorite_team_id=user.favorite_team_id,
        favorite_team_name=team_name,
        favorite_team_logo_url=team_logo_url,
        timezone=user.timezone,
        preferences=prefs,
        push_enabled=user.push_endpoint is not None,
    )


@router.post("", response_model=UserResponse, status_code=201)
async def create_user(
    body: UserCreate,
    db: AsyncSession = Depends(get_db),
) -> UserResponse:
    stmt = (
        select(User)
        .options(selectinload(User.favorite_team), selectinload(User.notification_preferences))
        .where(User.email == body.email.strip().lower())
    )
    result = await db.execute(stmt)
    existing = result.scalar_one_or_none()
    if existing:
        return _build_user_response(existing)

    user = User(
        email=body.email.strip().lower(),
        name=body.name,
        favorite_team_id=body.favorite_team_id,
        timezone=body.timezone or "UTC",
    )
    db.add(user)
    await db.flush()

    prefs = body.preferences or UserPreferences()
    notification_prefs = NotificationPreference(
        user_id=user.id,
        match_reminders=prefs.match_reminders,
        goal_alerts=prefs.goal_alerts,
        result_summaries=prefs.result_summaries,
    )
    db.add(notification_prefs)
    await db.commit()

    stmt = (
        select(User)
        .options(selectinload(User.favorite_team), selectinload(User.notification_preferences))
        .where(User.id == user.id)
    )
    result = await db.execute(stmt)
    user = result.scalar_one()
    return _build_user_response(user)


@router.get("/me", response_model=UserResponse)
async def get_me(
    email: str = Depends(get_current_email),
    db: AsyncSession = Depends(get_db),
) -> UserResponse:
    stmt = (
        select(User)
        .options(selectinload(User.favorite_team), selectinload(User.notification_preferences))
        .where(User.email == email)
    )
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return _build_user_response(user)


@router.patch("/me/team", response_model=UserResponse)
async def update_my_team(
    body: UserUpdateTeam,
    email: str = Depends(get_current_email),
    db: AsyncSession = Depends(get_db),
) -> UserResponse:
    stmt = select(User).where(User.email == email)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.favorite_team_id = body.favorite_team_id
    await db.commit()

    stmt = (
        select(User)
        .options(selectinload(User.favorite_team), selectinload(User.notification_preferences))
        .where(User.id == user.id)
    )
    result = await db.execute(stmt)
    user = result.scalar_one()
    return _build_user_response(user)


@router.patch("/me/preferences", response_model=UserResponse)
async def update_my_preferences(
    body: UserUpdatePreferences,
    email: str = Depends(get_current_email),
    db: AsyncSession = Depends(get_db),
) -> UserResponse:
    stmt = select(User).where(User.email == email)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    prefs_stmt = select(NotificationPreference).where(
        NotificationPreference.user_id == user.id
    )
    prefs_result = await db.execute(prefs_stmt)
    prefs = prefs_result.scalar_one_or_none()

    if prefs:
        if body.match_reminders is not None:
            prefs.match_reminders = body.match_reminders
        if body.goal_alerts is not None:
            prefs.goal_alerts = body.goal_alerts
        if body.result_summaries is not None:
            prefs.result_summaries = body.result_summaries
        await db.commit()

    stmt = (
        select(User)
        .options(selectinload(User.favorite_team), selectinload(User.notification_preferences))
        .where(User.id == user.id)
    )
    result = await db.execute(stmt)
    user = result.scalar_one()
    return _build_user_response(user)


@router.patch("/me/push-subscription", response_model=UserResponse)
async def update_push_subscription(
    body: PushSubscription,
    email: str = Depends(get_current_email),
    db: AsyncSession = Depends(get_db),
) -> UserResponse:
    stmt = select(User).where(User.email == email)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.push_endpoint = body.endpoint
    user.push_p256dh = body.keys.p256dh
    user.push_auth = body.keys.auth
    user.onboarding_complete = True
    await db.commit()

    stmt = (
        select(User)
        .options(selectinload(User.favorite_team), selectinload(User.notification_preferences))
        .where(User.id == user.id)
    )
    result = await db.execute(stmt)
    user = result.scalar_one()
    return _build_user_response(user)


@router.delete("/me/push-subscription", response_model=UserResponse)
async def delete_push_subscription(
    email: str = Depends(get_current_email),
    db: AsyncSession = Depends(get_db),
) -> UserResponse:
    stmt = select(User).where(User.email == email)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.push_endpoint = None
    user.push_p256dh = None
    user.push_auth = None
    await db.commit()

    stmt = (
        select(User)
        .options(selectinload(User.favorite_team), selectinload(User.notification_preferences))
        .where(User.id == user.id)
    )
    result = await db.execute(stmt)
    user = result.scalar_one()
    return _build_user_response(user)
