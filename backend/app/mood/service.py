from __future__ import annotations

from datetime import date, timedelta

from app.database import get_supabase_user_client
from app.mood.schemas import MoodLogCreate, MoodLogResponse, MoodTrend


async def log_mood(user_id: str, supabase_token: str, data: MoodLogCreate) -> MoodLogResponse:
    user_client = get_supabase_user_client(supabase_token)
    payload = data.model_dump()
    payload["logged_date"] = data.logged_date.isoformat()
    payload["user_id"] = user_id

    user_client.table("mood_logs").upsert(payload, on_conflict="user_id,logged_date").execute()
    response = (
        user_client.table("mood_logs")
        .select("*")
        .eq("user_id", user_id)
        .eq("logged_date", data.logged_date.isoformat())
        .single()
        .execute()
    )
    return MoodLogResponse(**response.data)


async def get_mood_logs(
    user_id: str,
    supabase_token: str,
    start_date: date | None = None,
    end_date: date | None = None,
) -> list[MoodLogResponse]:
    user_client = get_supabase_user_client(supabase_token)

    query = user_client.table("mood_logs").select("*").eq("user_id", user_id).order("logged_date", desc=False)
    if start_date:
        query = query.gte("logged_date", start_date.isoformat())
    if end_date:
        query = query.lte("logged_date", end_date.isoformat())

    response = query.execute()
    return [MoodLogResponse(**row) for row in (response.data or [])]


async def get_mood_trends(user_id: str, supabase_token: str, days: int = 30) -> list[MoodTrend]:
    end_date = date.today()
    start_date = end_date - timedelta(days=max(days - 1, 0))

    logs = await get_mood_logs(user_id, supabase_token, start_date, end_date)
    if not logs:
        return []

    trend_map: dict[date, dict[str, float]] = {}
    count_map: dict[date, int] = {}

    for row in logs:
        if row.logged_date not in trend_map:
            trend_map[row.logged_date] = {
                "avg_mood": 0.0,
                "avg_productivity": 0.0,
                "avg_energy": 0.0,
                "avg_stress": 0.0,
            }
            count_map[row.logged_date] = 0

        trend_map[row.logged_date]["avg_mood"] += row.mood_score
        trend_map[row.logged_date]["avg_productivity"] += row.productivity_score
        trend_map[row.logged_date]["avg_energy"] += row.energy_score
        trend_map[row.logged_date]["avg_stress"] += row.stress_score
        count_map[row.logged_date] += 1

    trends: list[MoodTrend] = []
    for log_date in sorted(trend_map.keys()):
        count = max(count_map[log_date], 1)
        values = trend_map[log_date]
        trends.append(
            MoodTrend(
                date=log_date,
                avg_mood=round(values["avg_mood"] / count, 2),
                avg_productivity=round(values["avg_productivity"] / count, 2),
                avg_energy=round(values["avg_energy"] / count, 2),
                avg_stress=round(values["avg_stress"] / count, 2),
            )
        )

    return trends
