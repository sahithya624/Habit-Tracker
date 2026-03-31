from __future__ import annotations

from datetime import date, datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field


class SummaryRequest(BaseModel):
    week_start: date


class SummaryResponse(BaseModel):
    summary_text: str
    recommendations: list[str]
    burnout_risk_score: float
    burnout_risk_level: str
    patterns_detected: list[str]


class WeeklySummaryRecord(SummaryResponse):
    id: UUID
    week_start: date
    week_end: date
    created_at: datetime


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1)


class ChatRequest(BaseModel):
    messages: list[ChatMessage]


class ChatResponse(BaseModel):
    reply: str
    suggestions: list[str]


class ClearHistoryResponse(BaseModel):
    deleted_count: int


class CoachConversationMessage(BaseModel):
    id: UUID
    user_id: UUID
    role: str
    content: str
    created_at: datetime
