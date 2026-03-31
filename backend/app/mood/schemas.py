from __future__ import annotations

from datetime import date, datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class MoodLogCreate(BaseModel):
    logged_date: date
    mood_score: int = Field(ge=1, le=10)
    productivity_score: int = Field(ge=1, le=10)
    energy_score: int = Field(ge=1, le=10)
    stress_score: int = Field(ge=1, le=10)
    notes: Optional[str] = Field(default=None, max_length=600)


class MoodLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    logged_date: date
    mood_score: int
    productivity_score: int
    energy_score: int
    stress_score: int
    notes: Optional[str] = None
    created_at: datetime


class MoodTrend(BaseModel):
    date: date
    avg_mood: float
    avg_productivity: float
    avg_energy: float
    avg_stress: float
