import logging

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger

from app.config import settings
from app.jobs.fixture_sync import run_fixture_sync
from app.jobs.live_poller import current_interval, run_live_poller
from app.jobs.reminder_scheduler import run_reminder_check

logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler(
    job_defaults={
        "coalesce": True,
        "max_instances": 1,
    }
)


def start() -> None:
    if scheduler.running:
        return
    scheduler.add_job(
        run_fixture_sync,
        trigger=IntervalTrigger(hours=settings.fixture_sync_interval_hours),
        id="fixture_sync",
        replace_existing=True,
    )
    scheduler.add_job(
        run_live_poller,
        trigger=IntervalTrigger(seconds=settings.poll_interval_idle_sec),
        id="live_poller",
        replace_existing=True,
    )
    scheduler.add_job(
        _adaptive_poll,
        trigger=IntervalTrigger(seconds=15),
        id="adaptive_poll_rescheduler",
        replace_existing=True,
    )
    scheduler.add_job(
        run_reminder_check,
        trigger=IntervalTrigger(minutes=2),
        id="reminder_check",
        replace_existing=True,
    )
    scheduler.start()


async def _adaptive_poll() -> None:
    interval = await current_interval()
    job = scheduler.get_job("live_poller")
    if job and job.trigger.interval.seconds != interval:
        scheduler.reschedule_job(
            "live_poller",
            trigger=IntervalTrigger(seconds=interval),
        )


def shutdown() -> None:
    if scheduler.running:
        scheduler.shutdown(wait=False)
