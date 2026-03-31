from fastapi import APIRouter, Depends, Query

from app.analytics.schemas import AnalyticsDashboard, BurnoutScore, PatternResult, ProductivityCycle
from app.analytics.service import calculate_burnout_score, detect_patterns, get_analytics_dashboard, get_productivity_cycle
from app.auth.utils import get_current_user_id, get_supabase_access_token

router = APIRouter(tags=["Analytics"])


@router.get("/dashboard", response_model=AnalyticsDashboard)
async def dashboard_route(
    user_id: str = Depends(get_current_user_id),
    supabase_token: str = Depends(get_supabase_access_token),
) -> AnalyticsDashboard:
    return await get_analytics_dashboard(user_id, supabase_token)


@router.get("/patterns", response_model=list[PatternResult])
async def patterns_route(
    days: int = Query(default=30, ge=1, le=365),
    user_id: str = Depends(get_current_user_id),
    supabase_token: str = Depends(get_supabase_access_token),
) -> list[PatternResult]:
    return await detect_patterns(user_id, supabase_token, days=days)


@router.get("/burnout", response_model=BurnoutScore)
async def burnout_route(
    user_id: str = Depends(get_current_user_id),
    supabase_token: str = Depends(get_supabase_access_token),
) -> BurnoutScore:
    return await calculate_burnout_score(user_id, supabase_token)


@router.get("/productivity-cycle", response_model=ProductivityCycle)
async def productivity_cycle_route(
    days: int = Query(default=30, ge=7, le=365),
    user_id: str = Depends(get_current_user_id),
    supabase_token: str = Depends(get_supabase_access_token),
) -> ProductivityCycle:
    return await get_productivity_cycle(user_id, supabase_token, days=days)
