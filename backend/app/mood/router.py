from datetime import date

from fastapi import APIRouter, Depends, Query

from app.auth.utils import get_current_user_id, get_supabase_access_token
from app.mood.schemas import MoodLogCreate, MoodLogResponse, MoodTrend
from app.mood.service import get_mood_logs, get_mood_trends, log_mood

router = APIRouter(tags=["Mood"])


@router.post("/", response_model=MoodLogResponse)
async def log_mood_route(
    data: MoodLogCreate,
    user_id: str = Depends(get_current_user_id),
    supabase_token: str = Depends(get_supabase_access_token),
) -> MoodLogResponse:
    return await log_mood(user_id, supabase_token, data)


@router.get("/", response_model=list[MoodLogResponse])
async def get_mood_logs_route(
    start_date: date | None = Query(default=None),
    end_date: date | None = Query(default=None),
    user_id: str = Depends(get_current_user_id),
    supabase_token: str = Depends(get_supabase_access_token),
) -> list[MoodLogResponse]:
    return await get_mood_logs(user_id, supabase_token, start_date, end_date)


@router.get("/trends", response_model=list[MoodTrend])
async def get_mood_trends_route(
    days: int = Query(default=30, ge=1, le=365),
    user_id: str = Depends(get_current_user_id),
    supabase_token: str = Depends(get_supabase_access_token),
) -> list[MoodTrend]:
    return await get_mood_trends(user_id, supabase_token, days)
