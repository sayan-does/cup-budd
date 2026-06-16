from contextlib import asynccontextmanager
import asyncio

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1 import health, matches, push, teams, users
from app.config import settings
from app.db.session import async_session_maker, init_db
from app.jobs import fixture_sync, scheduler


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        await init_db()
        async with async_session_maker() as db:
            await db.execute(__import__("sqlalchemy").text("SELECT 1"))
    except Exception as e:
        print(f"WARN: DB unavailable at startup — {e}. App will run in degraded mode.")

    try:
        asyncio.create_task(fixture_sync.run_fixture_sync())
    except Exception as e:
        print(f"WARN: fixture_sync task failed to start — {e}")

    scheduler.start()
    yield
    scheduler.shutdown()


app = FastAPI(title="Cup Budd API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_methods=["*"],
    allow_headers=["*"],
)

for r in (users.router, teams.router, matches.router, push.router, health.router):
    app.include_router(r, prefix="/api/v1")

# include standings endpoint
from app.api.v1.standings import router as standings_router
app.include_router(standings_router, prefix="/api/v1")
