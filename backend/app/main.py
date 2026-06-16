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
    # Initialize DB synchronously for startup checks
    await init_db()
    async with async_session_maker() as db:
        await db.execute(__import__("sqlalchemy").text("SELECT 1"))

    # Run fixture sync in the background so slow external calls don't block
    # the ASGI lifespan. The background task will create its own DB session
    # when called without a session (run_fixture_sync handles db=None).
    asyncio.create_task(fixture_sync.run_fixture_sync())

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
