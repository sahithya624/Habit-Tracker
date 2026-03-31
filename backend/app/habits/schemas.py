from __future__ import annotations

from datetime import date, datetime
from typing import Literal, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


HabitCategory = Literal["exercise", "sleep", "reading", "productivity", "custom"]
TargetFrequency = Literal["daily", "weekly"]


class HabitCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    category: HabitCategory
    target_frequency: TargetFrequency = "daily"
    target_value: Optional[float] = Field(default=None, ge=0)
    unit: Optional[str] = Field(default=None, max_length=32)
    color: str = Field(default="#6366f1", max_length=16)
    icon: str = Field(default="✅", max_length=8)


class HabitUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=120)
    category: Optional[HabitCategory] = None
    target_frequency: Optional[TargetFrequency] = None
    target_value: Optional[float] = Field(default=None, ge=0)
    unit: Optional[str] = Field(default=None, max_length=32)
    color: Optional[str] = Field(default=None, max_length=16)
    icon: Optional[str] = Field(default=None, max_length=8)
    is_active: Optional[bool] = None


class HabitResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    name: str
    category: str
    target_frequency: str
    target_value: Optional[float] = None
    unit: Optional[str] = None
    color: str
    icon: str
    is_active: bool
    created_at: datetime


class HabitLogCreate(BaseModel):
    habit_id: UUID
    logged_date: date
    value: float = Field(default=1, ge=0)
    notes: Optional[str] = Field(default=None, max_length=500)


class HabitLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    habit_id: UUID
    logged_date: date
    value: float
    notes: Optional[str] = None
    created_at: datetime


class HabitWithStreak(HabitResponse):
    current_streak: int = 0
    longest_streak: int = 0
    completion_rate_7d: float = 0.0
    completion_rate_30d: float = 0.0
