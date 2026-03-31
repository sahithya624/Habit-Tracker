from fastapi import APIRouter, Depends, Query

from app.ai.schemas import (
    ChatRequest,
    ChatResponse,
    ClearHistoryResponse,
    CoachConversationMessage,
    SummaryRequest,
    SummaryResponse,
    WeeklySummaryRecord,
)
from app.ai.service import (
    chat_with_coach,
    clear_coach_history,
    generate_weekly_summary,
    get_coach_history,
    get_weekly_summaries,
)
from app.auth.utils import get_current_user_id, get_supabase_access_token

router = APIRouter(tags=["AI"])


@router.post("/weekly-summary", response_model=SummaryResponse)
async def weekly_summary_route(
    data: SummaryRequest,
    user_id: str = Depends(get_current_user_id),
    supabase_token: str = Depends(get_supabase_access_token),
) -> SummaryResponse:
    return await generate_weekly_summary(user_id, data.week_start, supabase_token)


@router.get("/weekly-summaries", response_model=list[WeeklySummaryRecord])
async def weekly_summaries_route(
    limit: int = Query(default=10, ge=1, le=50),
    user_id: str = Depends(get_current_user_id),
    supabase_token: str = Depends(get_supabase_access_token),
) -> list[WeeklySummaryRecord]:
    return await get_weekly_summaries(user_id, supabase_token, limit)


@router.post("/coach", response_model=ChatResponse)
async def coach_chat_route(
    data: ChatRequest,
    user_id: str = Depends(get_current_user_id),
    supabase_token: str = Depends(get_supabase_access_token),
) -> ChatResponse:
    return await chat_with_coach(user_id, supabase_token, data.messages)


@router.get("/coach/history", response_model=list[CoachConversationMessage])
async def coach_history_route(
    limit: int = Query(default=50, ge=1, le=200),
    user_id: str = Depends(get_current_user_id),
    supabase_token: str = Depends(get_supabase_access_token),
) -> list[CoachConversationMessage]:
    return await get_coach_history(user_id, supabase_token, limit)


@router.delete("/coach/history", response_model=ClearHistoryResponse)
async def clear_coach_history_route(
    user_id: str = Depends(get_current_user_id),
    supabase_token: str = Depends(get_supabase_access_token),
) -> ClearHistoryResponse:
    return await clear_coach_history(user_id, supabase_token)
