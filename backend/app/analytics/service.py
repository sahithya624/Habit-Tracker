from __future__ import annotations

import asyncio
from collections import defaultdict
from datetime import date, datetime, timedelta
from statistics import mean
from typing import Any

from app.analytics.schemas import AnalyticsDashboard, BurnoutScore, PatternResult, ProductivityCycle, StreakSummary
from app.database import get_supabase_user_client



def _to_date(value: Any) -> date:
    if isinstance(value, date):
        return value
    return datetime.fromisoformat(str(value)).date()


def _to_float(value: Any, default: float = 0.0) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def _to_int(value: Any, default: int = 0) -> int:
    try:
        return int(float(value))
    except (TypeError, ValueError):
        return default


async def _get_habit_catalog(user_id: str, supabase_token: str) -> list[dict[str, Any]]:
    client = get_supabase_user_client(supabase_token)
    response = client.table("habits").select("*").eq("user_id", user_id).eq("is_active", True).execute()
    return response.data or []


async def _get_habit_logs(
    user_id: str,
    supabase_token: str,
    start_date: date | None = None,
    end_date: date | None = None,
) -> list[dict[str, Any]]:
    client = get_supabase_user_client(supabase_token)
    query = client.table("habit_logs").select("*").eq("user_id", user_id)
    if start_date:
        query = query.gte("logged_date", start_date.isoformat())
    if end_date:
        query = query.lte("logged_date", end_date.isoformat())

    response = query.execute()
    return response.data or []


async def _get_mood_logs(user_id: str, supabase_token: str, start_date: date, end_date: date) -> list[dict[str, Any]]:
    client = get_supabase_user_client(supabase_token)
    response = (
        client.table("mood_logs")
        .select("*")
        .eq("user_id", user_id)
        .gte("logged_date", start_date.isoformat())
        .lte("logged_date", end_date.isoformat())
        .order("logged_date", desc=False)
        .execute()
    )
    return response.data or []


def _current_streak_from_dates(logged_dates: set[date], reference_date: date) -> int:
    start_point = (
        reference_date
        if reference_date in logged_dates
        else (reference_date - timedelta(days=1) if (reference_date - timedelta(days=1)) in logged_dates else None)
    )
    if not start_point:
        return 0

    streak = 0
    cursor = start_point
    while cursor in logged_dates:
        streak += 1
        cursor -= timedelta(days=1)
    return streak


def _longest_streak_from_sorted_dates(sorted_dates: list[date]) -> int:
    if not sorted_dates:
        return 0

    longest = 1
    streak = 1
    for idx in range(1, len(sorted_dates)):
        if (sorted_dates[idx] - sorted_dates[idx - 1]).days == 1:
            streak += 1
            longest = max(longest, streak)
        else:
            streak = 1
    return longest


def _build_streak_summaries(
    habits: list[dict[str, Any]],
    all_habit_logs: list[dict[str, Any]],
    reference_date: date,
) -> list[StreakSummary]:
    habit_dates_map: defaultdict[str, set[date]] = defaultdict(set)
    for row in all_habit_logs:
        habit_id = str(row.get("habit_id"))
        logged = row.get("logged_date")
        if habit_id and logged:
            habit_dates_map[habit_id].add(_to_date(logged))

    seven_day_start = reference_date - timedelta(days=6)
    thirty_day_start = reference_date - timedelta(days=29)

    streaks: list[StreakSummary] = []
    for habit in habits:
        habit_id = str(habit["id"])
        date_set = habit_dates_map.get(habit_id, set())
        sorted_dates = sorted(date_set)

        current_streak = _current_streak_from_dates(date_set, reference_date)
        longest_streak = _longest_streak_from_sorted_dates(sorted_dates)

        completion_7d = (
            len({d for d in date_set if seven_day_start <= d <= reference_date}) / 7 if date_set else 0.0
        )
        completion_30d = (
            len({d for d in date_set if thirty_day_start <= d <= reference_date}) / 30 if date_set else 0.0
        )

        streaks.append(
            StreakSummary(
                habit_id=habit_id,
                habit_name=str(habit.get("name", "Habit")),
                current_streak=current_streak,
                longest_streak=longest_streak,
                completion_7d=round(completion_7d, 4),
                completion_30d=round(completion_30d, 4),
            )
        )

    return streaks


async def detect_patterns(
    user_id: str,
    supabase_token: str,
    days: int = 30,
    start_date: date | None = None,
    end_date: date | None = None,
) -> list[PatternResult]:
    end_date = end_date or date.today()
    start_date = start_date or (end_date - timedelta(days=max(days - 1, 0)))

    habits = await _get_habit_catalog(user_id, supabase_token)
    habit_logs = await _get_habit_logs(user_id, supabase_token, start_date, end_date)
    mood_logs = await _get_mood_logs(user_id, supabase_token, start_date, end_date)

    patterns: list[PatternResult] = []

    habit_dates_map: defaultdict[str, set[date]] = defaultdict(set)
    for row in habit_logs:
        habit_id = str(row.get("habit_id"))
        logged = row.get("logged_date")
        if habit_id and logged:
            habit_dates_map[habit_id].add(_to_date(logged))

    for habit in habits:
        habit_id = str(habit["id"])
        current = _current_streak_from_dates(habit_dates_map.get(habit_id, set()), end_date)
        if current >= 7:
            patterns.append(
                PatternResult(
                    pattern_type="Consistency",
                    description=f"Strong Consistency: '{habit['name']}' has a {current}-day active streak.",
                    severity="high",
                    detected_on=end_date,
                )
            )
        elif current >= 3:
            patterns.append(
                PatternResult(
                    pattern_type="Consistency",
                    description=f"Building Momentum: '{habit['name']}' is on a {current}-day streak.",
                    severity="moderate",
                    detected_on=end_date,
                )
            )

    habit_by_id = {habit["id"]: habit for habit in habits}
    mood_by_date = {str(row["logged_date"]): row for row in mood_logs}

    sleep_productivity_values: list[float] = []
    for row in habit_logs:
        habit = habit_by_id.get(row["habit_id"])
        if not habit or habit.get("category") != "sleep":
            continue
        if _to_float(row.get("value"), 0.0) < 6:
            mood = mood_by_date.get(str(row["logged_date"]))
            if mood:
                sleep_productivity_values.append(_to_float(mood.get("productivity_score"), 0.0))

    if len(sleep_productivity_values) >= 3 and mean(sleep_productivity_values) < 5:
        patterns.append(
            PatternResult(
                pattern_type="Sleep-Productivity",
                description="Low sleep (<6h) frequently aligns with productivity scores below 5.",
                severity="high",
                detected_on=end_date,
            )
        )

    exercise_dates: set[date] = set()
    for row in habit_logs:
        habit = habit_by_id.get(row["habit_id"])
        if habit and habit.get("category") == "exercise":
            exercise_dates.add(_to_date(row["logged_date"]))

    next_day_moods: list[float] = []
    baseline_moods: list[float] = []
    exercise_next_dates = {d + timedelta(days=1) for d in exercise_dates}

    for mood in mood_logs:
        logged = _to_date(mood["logged_date"])
        mood_score = _to_float(mood.get("mood_score"), 0.0)
        if logged in exercise_next_dates:
            next_day_moods.append(mood_score)
        else:
            baseline_moods.append(mood_score)

    if next_day_moods and baseline_moods:
        uplift = mean(next_day_moods) - mean(baseline_moods)
        if uplift > 1.5:
            patterns.append(
                PatternResult(
                    pattern_type="Exercise-Mood",
                    description=f"Exercise days are linked with +{uplift:.1f} higher next-day mood on average.",
                    severity="moderate",
                    detected_on=end_date,
                )
            )

    high_stress_streak = 0
    max_streak = 0
    for mood in mood_logs:
        if _to_int(mood.get("stress_score"), 0) > 7:
            high_stress_streak += 1
            max_streak = max(max_streak, high_stress_streak)
        else:
            high_stress_streak = 0

    if max_streak >= 3:
        patterns.append(
            PatternResult(
                pattern_type="Burnout Precursor",
                description=f"Stress remained above 7 for {max_streak} consecutive days.",
                severity="high",
                detected_on=end_date,
            )
        )

    if habits:
        total_habits = len(habits)
        completion_by_day: defaultdict[date, set[str]] = defaultdict(set)
        for row in habit_logs:
            completion_by_day[_to_date(row["logged_date"])].add(str(row["habit_id"]))

        weekday_rates: list[float] = []
        weekend_rates: list[float] = []
        day_cursor = start_date
        while day_cursor <= end_date:
            completed = len(completion_by_day.get(day_cursor, set()))
            rate = completed / max(total_habits, 1)
            if day_cursor.weekday() >= 5:
                weekend_rates.append(rate)
            else:
                weekday_rates.append(rate)
            day_cursor += timedelta(days=1)

        if weekday_rates and weekend_rates:
            weekday_avg = mean(weekday_rates)
            weekend_avg = mean(weekend_rates)
            if weekday_avg > 0 and ((weekday_avg - weekend_avg) / weekday_avg) > 0.4:
                drop_percent = ((weekday_avg - weekend_avg) / weekday_avg) * 100
                patterns.append(
                    PatternResult(
                        pattern_type="Weekend Drop",
                        description=f"Weekend completion drops by {drop_percent:.0f}% compared with weekdays.",
                        severity="moderate",
                        detected_on=end_date,
                    )
                )

    return patterns


async def calculate_burnout_score(user_id: str, supabase_token: str) -> BurnoutScore:
    end_date = date.today()
    start_date = end_date - timedelta(days=13)

    habits = await _get_habit_catalog(user_id, supabase_token)
    habit_logs = await _get_habit_logs(user_id, supabase_token, start_date, end_date)
    mood_logs = await _get_mood_logs(user_id, supabase_token, start_date, end_date)

    score = 0
    factors: list[str] = []
    recommendations: list[str] = []

    sleep_habit_ids = {habit["id"] for habit in habits if habit.get("category") == "sleep"}
    sleep_logs_by_day: defaultdict[date, list[float]] = defaultdict(list)
    for row in habit_logs:
        if row["habit_id"] in sleep_habit_ids:
            sleep_logs_by_day[_to_date(row["logged_date"])].append(_to_float(row.get("value"), 0.0))

    high_stress_days = 0
    low_mood_days = 0
    low_productivity_days = 0
    low_sleep_days = 0

    for mood in mood_logs:
        day = _to_date(mood["logged_date"])
        stress = _to_int(mood.get("stress_score"), 0)
        mood_score = _to_int(mood.get("mood_score"), 0)
        productivity = _to_int(mood.get("productivity_score"), 0)

        if 1 <= stress <= 3:
            score -= 4
        if 7 <= stress <= 10:
            score += 15
            high_stress_days += 1

        if mood_score < 4:
            score += 10
            low_mood_days += 1

        if productivity < 4:
            score += 8
            low_productivity_days += 1

        if sleep_logs_by_day.get(day):
            if mean(sleep_logs_by_day[day]) < 6:
                score += 12
                low_sleep_days += 1

    if high_stress_days:
        factors.append(f"High stress on {high_stress_days} of last 14 days")
        recommendations.append("Block 20 minutes daily for stress-down routines like walks or breathing resets.")
    if low_mood_days:
        factors.append(f"Low mood on {low_mood_days} days")
        recommendations.append("Add one guaranteed recovery activity each day to stabilize mood.")
    if low_productivity_days:
        factors.append(f"Low productivity on {low_productivity_days} days")
        recommendations.append("Use 2 priority tasks/day and protect them before reactive work.")
    if low_sleep_days:
        factors.append(f"Sleep under 6 hours on {low_sleep_days} logged days")
        recommendations.append("Set a fixed wind-down alarm and reduce caffeine after noon.")

    if habits:
        habit_days_expected = len(habits) * 14
        habit_days_done = len({(row["habit_id"], str(row["logged_date"])) for row in habit_logs})
        completion_rate = habit_days_done / max(habit_days_expected, 1)
        if completion_rate > 0.8:
            score -= 10
            factors.append("Strong habit adherence above 80% helps protect against burnout")

    score = max(0, min(100, score))

    if score <= 25:
        level = "low"
    elif score <= 50:
        level = "moderate"
    elif score <= 75:
        level = "high"
    else:
        level = "critical"

    if not recommendations:
        recommendations.append("Keep your current routine and review your energy/stress trends weekly.")

    return BurnoutScore(score=score, level=level, contributing_factors=factors, recommendations=recommendations)


async def get_productivity_cycle(user_id: str, supabase_token: str, days: int = 30) -> ProductivityCycle:
    end_date = date.today()
    start_date = end_date - timedelta(days=max(days - 1, 0))

    mood_logs = await _get_mood_logs(user_id, supabase_token, start_date, end_date)
    weekday_map: dict[str, list[float]] = {
        "Monday": [],
        "Tuesday": [],
        "Wednesday": [],
        "Thursday": [],
        "Friday": [],
        "Saturday": [],
        "Sunday": [],
    }

    for row in mood_logs:
        day = _to_date(row["logged_date"]).strftime("%A")
        weekday_map[day].append(_to_float(row.get("productivity_score"), 0.0))

    day_scores = {day: round(mean(values), 2) if values else 0.0 for day, values in weekday_map.items()}

    non_zero_scores = {k: v for k, v in day_scores.items() if v > 0}
    if non_zero_scores:
        peak_day = max(non_zero_scores, key=non_zero_scores.get)
        trough_day = min(non_zero_scores, key=non_zero_scores.get)
    else:
        peak_day = "N/A"
        trough_day = "N/A"

    patterns = {
        "peak_day": peak_day,
        "trough_day": trough_day,
        "insight": f"You're most productive on {peak_day} and least productive on {trough_day}.",
    }

    return ProductivityCycle(day_of_week_scores=day_scores, time_patterns=patterns)


async def get_analytics_dashboard(user_id: str, supabase_token: str) -> AnalyticsDashboard:
    today = date.today()
    habits, all_habit_logs = await asyncio.gather(
        _get_habit_catalog(user_id, supabase_token),
        _get_habit_logs(user_id, supabase_token),
    )
    streaks = _build_streak_summaries(habits, all_habit_logs, today)

    burnout, patterns, productivity_cycle = await asyncio.gather(
        calculate_burnout_score(user_id, supabase_token),
        detect_patterns(user_id, supabase_token, days=30),
        get_productivity_cycle(user_id, supabase_token, days=30),
    )

    top_habits = sorted(streaks, key=lambda item: (item.completion_30d, item.current_streak), reverse=True)[:5]

    return AnalyticsDashboard(
        streaks=streaks,
        burnout=burnout,
        patterns=patterns,
        productivity_cycle=productivity_cycle,
        top_habits=top_habits,
    )
