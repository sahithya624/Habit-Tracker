from datetime import date

from fastapi import APIRouter, Depends, Query

from app.auth.utils import get_current_user_id, get_supabase_access_token
from app.habits.schemas import HabitCreate, HabitLogCreate, HabitLogResponse, HabitResponse, HabitUpdate, HabitWithStreak
from app.habits.service import (
    create_habit,
    delete_habit,
    get_all_logs_range,
    get_habit_logs,
    get_habits,
    log_habit,
    update_habit,
)

router = APIRouter(tags=["Habits"])


@router.post("/", response_model=HabitResponse)
async def create_habit_route(
    data: HabitCreate,
    user_id: str = Depends(get_current_user_id),
    supabase_token: str = Depends(get_supabase_access_token),
) -> HabitResponse:
    return await create_habit(user_id, supabase_token, data)


@router.get("/", response_model=list[HabitWithStreak])
async def get_habits_route(
    include_archived: bool = Query(default=False),
    user_id: str = Depends(get_current_user_id),
    supabase_token: str = Depends(get_supabase_access_token),
) -> list[HabitWithStreak]:
    return await get_habits(user_id, supabase_token, include_archived=include_archived)


@router.put("/{habit_id}", response_model=HabitResponse)
async def update_habit_route(
    habit_id: str,
    data: HabitUpdate,
    user_id: str = Depends(get_current_user_id),
    supabase_token: str = Depends(get_supabase_access_token),
) -> HabitResponse:
    return await update_habit(habit_id, user_id, supabase_token, data)


@router.delete("/{habit_id}")
async def delete_habit_route(
    habit_id: str,
    user_id: str = Depends(get_current_user_id),
    supabase_token: str = Depends(get_supabase_access_token),
) -> dict[str, str]:
    return await delete_habit(habit_id, user_id, supabase_token)


@router.post("/log", response_model=HabitLogResponse)
async def log_habit_route(
    data: HabitLogCreate,
    user_id: str = Depends(get_current_user_id),
    supabase_token: str = Depends(get_supabase_access_token),
) -> HabitLogResponse:
    return await log_habit(user_id, supabase_token, data)


@router.get("/{habit_id}/logs", response_model=list[HabitLogResponse])
async def get_habit_logs_route(
    habit_id: str,
    start_date: date | None = Query(default=None),
    end_date: date | None = Query(default=None),
    user_id: str = Depends(get_current_user_id),
    supabase_token: str = Depends(get_supabase_access_token),
) -> list[HabitLogResponse]:
    return await get_habit_logs(user_id, habit_id, supabase_token, start_date, end_date)


@router.get("/logs/all", response_model=list[HabitLogResponse])
async def get_all_logs_range_route(
    start_date: date | None = Query(default=None),
    end_date: date | None = Query(default=None),
    user_id: str = Depends(get_current_user_id),
    supabase_token: str = Depends(get_supabase_access_token),
) -> list[HabitLogResponse]:
    return await get_all_logs_range(user_id, supabase_token, start_date, end_date)
