from __future__ import annotations

from datetime import date, datetime, timedelta
from typing import Any
from uuid import uuid4

from fastapi import HTTPException, status

from app.database import get_supabase_user_client
from app.habits.schemas import HabitCreate, HabitLogCreate, HabitLogResponse, HabitResponse, HabitUpdate, HabitWithStreak



def _to_date(value: Any) -> date:
    if isinstance(value, date):
        return value
    return datetime.fromisoformat(str(value)).date()


async def create_habit(user_id: str, supabase_token: str, data: HabitCreate) -> HabitResponse:
    user_client = get_supabase_user_client(supabase_token)
    payload = data.model_dump()
    payload["user_id"] = user_id
    payload["id"] = str(uuid4())

    try:
        user_client.table("habits").insert(payload).execute()
        created = user_client.table("habits").select("*").eq("id", payload["id"]).single().execute()
        if not created.data:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Could not create habit")
        return HabitResponse(**created.data)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Habit creation failed: {exc}") from exc


async def calculate_streak(habit_id: str, user_id: str, supabase_token: str) -> dict[str, int]:
    user_client = get_supabase_user_client(supabase_token)
    logs_resp = (
        user_client.table("habit_logs")
        .select("logged_date")
        .eq("habit_id", habit_id)
        .eq("user_id", user_id)
        .order("logged_date", desc=False)
        .execute()
    )
    rows = logs_resp.data or []
    if not rows:
        return {"current_streak": 0, "longest_streak": 0}

    logged_dates = sorted({_to_date(row["logged_date"]) for row in rows})
    date_set = set(logged_dates)

    longest = 1
    streak = 1
    for idx in range(1, len(logged_dates)):
        if (logged_dates[idx] - logged_dates[idx - 1]).days == 1:
            streak += 1
            longest = max(longest, streak)
        else:
            streak = 1

    today = date.today()
    start_point = today if today in date_set else (today - timedelta(days=1) if (today - timedelta(days=1)) in date_set else None)

    current = 0
    if start_point:
        cursor = start_point
        while cursor in date_set:
            current += 1
            cursor -= timedelta(days=1)

    return {"current_streak": current, "longest_streak": longest}


async def calculate_completion_rate(habit_id: str, user_id: str, days: int, supabase_token: str) -> float:
    end_date = date.today()
    start_date = end_date - timedelta(days=days - 1)
    user_client = get_supabase_user_client(supabase_token)

    logs_resp = (
        user_client.table("habit_logs")
        .select("logged_date")
        .eq("habit_id", habit_id)
        .eq("user_id", user_id)
        .gte("logged_date", start_date.isoformat())
        .lte("logged_date", end_date.isoformat())
        .execute()
    )

    completed_days = len({_to_date(row["logged_date"]) for row in (logs_resp.data or [])})
    return round(completed_days / max(days, 1), 4)


async def get_habits(user_id: str, supabase_token: str, include_archived: bool = False) -> list[HabitWithStreak]:
    user_client = get_supabase_user_client(supabase_token)

    query = user_client.table("habits").select("*").eq("user_id", user_id).order("created_at", desc=False)
    if not include_archived:
        query = query.eq("is_active", True)
    response = query.execute()
    habits = response.data or []

    results: list[HabitWithStreak] = []
    for habit in habits:
        streaks = await calculate_streak(habit["id"], user_id, supabase_token)
        completion_7d = await calculate_completion_rate(habit["id"], user_id, 7, supabase_token)
        completion_30d = await calculate_completion_rate(habit["id"], user_id, 30, supabase_token)

        results.append(
            HabitWithStreak(
                **habit,
                current_streak=streaks["current_streak"],
                longest_streak=streaks["longest_streak"],
                completion_rate_7d=completion_7d,
                completion_rate_30d=completion_30d,
            )
        )

    return results


async def update_habit(habit_id: str, user_id: str, supabase_token: str, data: HabitUpdate) -> HabitResponse:
    update_payload = data.model_dump(exclude_none=True)
    if not update_payload:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No habit fields provided")

    user_client = get_supabase_user_client(supabase_token)
    user_client.table("habits").update(update_payload).eq("id", habit_id).eq("user_id", user_id).execute()
    updated = user_client.table("habits").select("*").eq("id", habit_id).eq("user_id", user_id).single().execute()
    if not updated.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Habit not found")

    return HabitResponse(**updated.data)


async def delete_habit(habit_id: str, user_id: str, supabase_token: str) -> dict[str, str]:
    user_client = get_supabase_user_client(supabase_token)
    existing = user_client.table("habits").select("id").eq("id", habit_id).eq("user_id", user_id).execute()
    if not existing.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Habit not found")
    user_client.table("habits").update({"is_active": False}).eq("id", habit_id).eq("user_id", user_id).execute()
    return {"message": "Habit archived successfully"}


async def log_habit(user_id: str, supabase_token: str, data: HabitLogCreate) -> HabitLogResponse:
    user_client = get_supabase_user_client(supabase_token)

    habit_check = (
        user_client.table("habits")
        .select("id, user_id")
        .eq("id", str(data.habit_id))
        .eq("user_id", user_id)
        .eq("is_active", True)
        .single()
        .execute()
    )
    if not habit_check.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Habit not found or inactive")

    payload = data.model_dump()
    payload["habit_id"] = str(data.habit_id)
    payload["user_id"] = user_id
    payload["logged_date"] = data.logged_date.isoformat()

    user_client.table("habit_logs").upsert(payload, on_conflict="habit_id,logged_date").execute()
    response = (
        user_client.table("habit_logs")
        .select("*")
        .eq("user_id", user_id)
        .eq("habit_id", str(data.habit_id))
        .eq("logged_date", data.logged_date.isoformat())
        .single()
        .execute()
    )
    if not response.data:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Could not save habit log")

    return HabitLogResponse(**response.data)


async def get_habit_logs(
    user_id: str,
    habit_id: str,
    supabase_token: str,
    start_date: date | None = None,
    end_date: date | None = None,
) -> list[HabitLogResponse]:
    user_client = get_supabase_user_client(supabase_token)
    query = (
        user_client.table("habit_logs")
        .select("*")
        .eq("user_id", user_id)
        .eq("habit_id", habit_id)
        .order("logged_date", desc=False)
    )

    if start_date:
        query = query.gte("logged_date", start_date.isoformat())
    if end_date:
        query = query.lte("logged_date", end_date.isoformat())

    response = query.execute()
    return [HabitLogResponse(**row) for row in (response.data or [])]


async def get_all_logs_range(
    user_id: str,
    supabase_token: str,
    start_date: date | None = None,
    end_date: date | None = None,
) -> list[HabitLogResponse]:
    user_client = get_supabase_user_client(supabase_token)
    query = user_client.table("habit_logs").select("*").eq("user_id", user_id).order("logged_date", desc=False)

    if start_date:
        query = query.gte("logged_date", start_date.isoformat())
    if end_date:
        query = query.lte("logged_date", end_date.isoformat())

    response = query.execute()
    return [HabitLogResponse(**row) for row in (response.data or [])]
