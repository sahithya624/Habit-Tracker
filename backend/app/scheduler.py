from __future__ import annotations

import logging
from datetime import date, timedelta
from zoneinfo import ZoneInfo

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

from app.ai.service import generate_weekly_summary
from app.database import supabase

logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler(timezone=ZoneInfo("UTC"))


async def generate_weekly_summaries_job() -> None:
    today = date.today()
    week_end = today
    week_start = week_end - timedelta(days=6)

    habit_users_resp = (
        supabase.table("habit_logs")
        .select("user_id")
        .gte("logged_date", week_start.isoformat())
        .lte("logged_date", week_end.isoformat())
        .execute()
    )
    mood_users_resp = (
        supabase.table("mood_logs")
        .select("user_id")
        .gte("logged_date", week_start.isoformat())
        .lte("logged_date", week_end.isoformat())
        .execute()
    )

    user_ids = {row["user_id"] for row in (habit_users_resp.data or [])}
    user_ids.update({row["user_id"] for row in (mood_users_resp.data or [])})

    if not user_ids:
        logger.info("Scheduler: no active users with weekly logs")
        return

    for user_id in user_ids:
        existing = (
            supabase.table("ai_summaries")
            .select("id")
            .eq("user_id", user_id)
            .eq("week_start", week_start.isoformat())
            .limit(1)
            .execute()
        )
        if existing.data:
            continue

        try:
            await generate_weekly_summary(user_id=user_id, week_start=week_start, supabase_token=None)
            logger.info("Scheduler: generated summary for user %s week %s", user_id, week_start)
        except Exception as exc:  # noqa: BLE001
            logger.exception("Scheduler: summary generation failed for user %s: %s", user_id, exc)



def start_scheduler() -> None:
    if scheduler.running:
        return

    scheduler.add_job(
        generate_weekly_summaries_job,
        trigger=CronTrigger(day_of_week="sun", hour=23, minute=59, timezone=ZoneInfo("UTC")),
        id="weekly_summary_job",
        replace_existing=True,
    )
    scheduler.start()



def stop_scheduler() -> None:
    if scheduler.running:
        scheduler.shutdown(wait=False)
