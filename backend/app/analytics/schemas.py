from __future__ import annotations

from datetime import date
from typing import Dict, List

from pydantic import BaseModel, Field


class PatternResult(BaseModel):
    pattern_type: str
    description: str
    severity: str
    detected_on: date


class BurnoutScore(BaseModel):
    score: int = Field(ge=0, le=100)
    level: str
    contributing_factors: List[str]
    recommendations: List[str]


class StreakSummary(BaseModel):
    habit_id: str
    habit_name: str
    current_streak: int
    longest_streak: int
    completion_7d: float
    completion_30d: float


class ProductivityCycle(BaseModel):
    day_of_week_scores: Dict[str, float]
    time_patterns: Dict[str, str]


class AnalyticsDashboard(BaseModel):
    streaks: List[StreakSummary]
    burnout: BurnoutScore
    patterns: List[PatternResult]
    productivity_cycle: ProductivityCycle
    top_habits: List[StreakSummary]
