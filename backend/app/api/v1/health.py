from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.jobs.scheduler import scheduler
from app.schemas.health import HealthResponse
from app.services.cache import redis_cache

router = APIRouter(prefix="/health", tags=["health"])


@router.get("", response_model=HealthResponse)
async def health_check(
    db: AsyncSession = Depends(get_db),
) -> HealthResponse:
    db_status = "ok"
    try:
        await db.execute(text("SELECT 1"))
    except Exception:
        db_status = "error"

    redis_status = "ok"
    try:
        await redis_cache.get("health:ping")
    except Exception:
        redis_status = "error"

    scheduler_status = "running" if scheduler.running else "stopped"

    return HealthResponse(
        status="ok" if db_status == "ok" else "degraded",
        db=db_status,
        redis=redis_status,
        scheduler=scheduler_status,
    )
