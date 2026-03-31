from __future__ import annotations

import asyncio
import json
import logging
from collections import defaultdict
from datetime import date, timedelta
from statistics import mean
from typing import Any

from fastapi import HTTPException, status
from groq import Groq

from app.ai.schemas import (
    ChatMessage,
    ChatResponse,
    ClearHistoryResponse,
    CoachConversationMessage,
    SummaryResponse,
    WeeklySummaryRecord,
)
from app.analytics.service import calculate_burnout_score
from app.analytics.service import detect_patterns
from app.config import settings
from app.database import get_supabase_user_client, supabase

MODEL_NAME = "llama3-8b-8192"
MODEL_CALL_TIMEOUT_SECONDS = 12
logger = logging.getLogger(__name__)



def _extract_json(content: str) -> dict[str, Any]:
    stripped = content.strip()
    if stripped.startswith("```"):
        stripped = stripped.strip("`")
        if stripped.startswith("json"):
            stripped = stripped[4:].strip()
    start = stripped.find("{")
    end = stripped.rfind("}")
    if start != -1 and end != -1:
        stripped = stripped[start : end + 1]
    return json.loads(stripped)



def _get_client() -> Groq:
    if not settings.groq_api_key:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Missing GROQ_API_KEY")
    return Groq(api_key=settings.groq_api_key)


async def _model_chat_completion(
    messages: list[dict[str, str]],
    temperature: float,
    timeout_seconds: int = MODEL_CALL_TIMEOUT_SECONDS,
) -> str:
    def _run() -> str:
        client = _get_client()
        completion = client.chat.completions.create(
            model=MODEL_NAME,
            messages=messages,
            temperature=temperature,
        )
        return completion.choices[0].message.content or ""

    return await asyncio.wait_for(asyncio.to_thread(_run), timeout=timeout_seconds)


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


async def _fetch_week_data(
    user_id: str,
    week_start: date,
    week_end: date,
    supabase_token: str | None,
) -> tuple[list[dict[str, Any]], list[dict[str, Any]], list[dict[str, Any]]]:
    client = get_supabase_user_client(supabase_token) if supabase_token else supabase

    habits_resp = client.table("habits").select("id,name,category,target_value,unit").eq("user_id", user_id).execute()
    habit_logs_resp = (
        client.table("habit_logs")
        .select("*")
        .eq("user_id", user_id)
        .gte("logged_date", week_start.isoformat())
        .lte("logged_date", week_end.isoformat())
        .execute()
    )
    mood_logs_resp = (
        client.table("mood_logs")
        .select("*")
        .eq("user_id", user_id)
        .gte("logged_date", week_start.isoformat())
        .lte("logged_date", week_end.isoformat())
        .execute()
    )

    return habits_resp.data or [], habit_logs_resp.data or [], mood_logs_resp.data or []



def _weekly_burnout_from_logs(habits: list[dict[str, Any]], habit_logs: list[dict[str, Any]], mood_logs: list[dict[str, Any]]) -> tuple[int, str]:
    score = 0

    sleep_habit_ids = {habit["id"] for habit in habits if habit.get("category") == "sleep"}
    sleep_map: defaultdict[str, list[float]] = defaultdict(list)
    for row in habit_logs:
        if row.get("habit_id") in sleep_habit_ids:
            sleep_map[str(row["logged_date"])].append(_to_float(row.get("value"), 0.0))

    for mood in mood_logs:
        stress = _to_int(mood.get("stress_score"), 0)
        mood_score = _to_int(mood.get("mood_score"), 0)
        productivity = _to_int(mood.get("productivity_score"), 0)

        if 1 <= stress <= 3:
            score -= 4
        if stress >= 7:
            score += 15
        if mood_score < 4:
            score += 10
        if productivity < 4:
            score += 8

        day = str(mood.get("logged_date"))
        if sleep_map.get(day) and mean(sleep_map[day]) < 6:
            score += 12

    if habits:
        expected = len(habits) * 7
        completed = len({(row["habit_id"], str(row["logged_date"])) for row in habit_logs})
        if completed / max(expected, 1) > 0.8:
            score -= 10

    score = max(0, min(100, score))

    if score <= 25:
        level = "low"
    elif score <= 50:
        level = "moderate"
    elif score <= 75:
        level = "high"
    else:
        level = "critical"

    return score, level



def _build_habit_completion_summary(habits: list[dict[str, Any]], habit_logs: list[dict[str, Any]]) -> str:
    if not habits:
        return "No habits configured this week."

    by_habit: defaultdict[str, int] = defaultdict(int)
    for log in habit_logs:
        by_habit[str(log["habit_id"])] += 1

    lines = []
    for habit in habits:
        count = by_habit.get(str(habit["id"]), 0)
        lines.append(f"- {habit['name']}: {count} check-ins")
    return "\n".join(lines)



def _safe_mean(values: list[float]) -> float:
    return round(mean(values), 2) if values else 0.0


def _build_fallback_recommendations(
    burnout_level: str,
    avg_stress: float,
    avg_productivity: float,
    avg_mood: float,
) -> list[str]:
    recommendations: list[str] = []

    if burnout_level in {"high", "critical"}:
        recommendations.append("Reduce your daily target load and protect at least one recovery block.")
    if avg_stress >= 6:
        recommendations.append("Add a 10-15 minute stress reset routine after your most demanding task.")
    if avg_productivity <= 5:
        recommendations.append("Pick your top 2 priorities each morning before checking messages.")
    if avg_mood <= 5:
        recommendations.append("Schedule one small mood-lifting activity each day this week.")

    if not recommendations:
        recommendations.append("Keep your momentum and review your mood and stress trends twice this week.")

    return recommendations[:3]


def _build_fallback_weekly_summary(
    week_start: date,
    week_end: date,
    burnout_level: str,
    burnout_score: int,
    avg_mood: float,
    avg_productivity: float,
    avg_stress: float,
    pattern_descriptions: list[str],
) -> str:
    pattern_note = pattern_descriptions[0] if pattern_descriptions else "No major negative patterns were detected."
    return (
        f"For {week_start.isoformat()} to {week_end.isoformat()}, your consistency data shows steady progress opportunities. "
        f"Average mood was {avg_mood}/10, productivity was {avg_productivity}/10, and stress was {avg_stress}/10.\n\n"
        f"Burnout risk is currently {burnout_level} ({burnout_score}/100). Key pattern signal: {pattern_note}\n"
        "Focus next week on a lighter workload cadence, stable sleep timing, and one daily recovery action."
    )


def _build_fallback_coach_reply(
    user_message: str,
    burnout_level: str,
    burnout_score: int,
    habits: list[dict[str, Any]],
    habit_logs: list[dict[str, Any]],
    mood_logs: list[dict[str, Any]],
) -> str:
    habit_count = len(habits)
    logs_count = len(habit_logs)
    mood_count = len(mood_logs)
    avg_productivity = _safe_mean([_to_float(item.get("productivity_score"), 0.0) for item in mood_logs])
    avg_stress = _safe_mean([_to_float(item.get("stress_score"), 0.0) for item in mood_logs])
    lower_message = (user_message or "").strip().lower()

    if lower_message in {"hi", "hello", "hey", "yo", "hola", "hi aria", "hello aria"}:
        return (
            "Hey, I am Aria. Great to see you here.\n\n"
            f"Right now your burnout risk is {burnout_level} ({burnout_score}/100). "
            "Tell me one goal for tomorrow and I will turn it into a clear 3-step plan."
        )

    if "priorit" in lower_message or "tomorrow" in lower_message:
        return (
            "Use this simple tomorrow plan:\n"
            "1. Pick your top 2 must-do tasks before checking messages.\n"
            "2. Start with a 25-minute focus block on task #1.\n"
            "3. Add one 10-minute reset break after your hardest task.\n\n"
            f"Based on your current trend (burnout {burnout_score}/100, stress {avg_stress}/10), this keeps load manageable."
        )

    if "evening" in lower_message or "reset" in lower_message or "routine" in lower_message:
        return (
            "Try this 15-minute evening reset:\n"
            "1. 5 min: brain dump tomorrow's tasks.\n"
            "2. 5 min: light stretch + slow breathing.\n"
            "3. 5 min: prep one easy morning win (water, notebook, task list).\n\n"
            "This reduces decision fatigue and improves next-day consistency."
        )

    if "habit" in lower_message and ("productivity" in lower_message or "lift" in lower_message):
        return (
            "For productivity lift, start with one keystone habit: a fixed first focus block daily.\n\n"
            "Do 25 focused minutes at the same time each day before reactive work. "
            "Track it for 7 days and we can tune the timing using your mood/productivity trend."
        )

    if burnout_level in {"high", "critical"}:
        coaching_focus = "reduce commitments and protect at least one recovery block daily."
    elif burnout_level == "moderate":
        coaching_focus = "tighten your priorities and add one short stress reset each day."
    else:
        coaching_focus = "maintain momentum with a simple, repeatable routine."

    return (
        f"Here is what I see: {habit_count} active habits, {logs_count} recent habit logs, {mood_count} recent mood logs, "
        f"burnout {burnout_score}/100 ({burnout_level}), productivity {avg_productivity}/10.\n\n"
        f"Next best move: {coaching_focus} For tomorrow, lock your top 2 tasks, finish one easy win early, "
        "and run a short evening reset."
    )


def _build_intent_coach_reply(user_message: str, burnout_level: str, burnout_score: int) -> str | None:
    lower_message = (user_message or "").strip().lower()
    if not lower_message:
        return None

    if lower_message in {"hi", "hello", "hey", "yo", "hola", "hi aria", "hello aria"}:
        return (
            "Hey, I am Aria. Great to see you here.\n\n"
            f"Right now your burnout risk is {burnout_level} ({burnout_score}/100). "
            "Tell me one goal for tomorrow and I will turn it into a clear 3-step plan."
        )

    if "evening" in lower_message and ("reset" in lower_message or "routine" in lower_message):
        return (
            "Try this 15-minute evening reset:\n"
            "1. 5 min: brain dump tomorrow's tasks.\n"
            "2. 5 min: light stretch + slow breathing.\n"
            "3. 5 min: prep one easy morning win (water, notebook, task list).\n\n"
            "This reduces decision fatigue and improves next-day consistency."
        )

    if "priorit" in lower_message or "tomorrow" in lower_message:
        return (
            "Use this simple tomorrow plan:\n"
            "1. Pick your top 2 must-do tasks before checking messages.\n"
            "2. Start with a 25-minute focus block on task #1.\n"
            "3. Add one 10-minute reset break after your hardest task.\n\n"
            f"Based on your current trend (burnout {burnout_score}/100, {burnout_level} risk), this keeps load manageable."
        )

    if "habit" in lower_message and ("productivity" in lower_message or "lift" in lower_message):
        return (
            "For productivity lift, start with one keystone habit: a fixed first focus block daily.\n\n"
            "Do 25 focused minutes at the same time each day before reactive work. "
            "Track it for 7 days and we can tune the timing using your mood/productivity trend."
        )

    return None


async def generate_weekly_summary(
    user_id: str,
    week_start: date,
    supabase_token: str | None = None,
) -> SummaryResponse:
    week_end = week_start + timedelta(days=6)

    habits, habit_logs, mood_logs = await _fetch_week_data(user_id, week_start, week_end, supabase_token)
    has_week_activity = bool(habit_logs or mood_logs)

    mood_vals = [_to_float(item.get("mood_score"), 0.0) for item in mood_logs]
    prod_vals = [_to_float(item.get("productivity_score"), 0.0) for item in mood_logs]
    stress_vals = [_to_float(item.get("stress_score"), 0.0) for item in mood_logs]
    energy_vals = [_to_float(item.get("energy_score"), 0.0) for item in mood_logs]

    burnout_score, burnout_level = _weekly_burnout_from_logs(habits, habit_logs, mood_logs)
    patterns = await detect_patterns(
        user_id,
        supabase_token or "",
        days=7,
        start_date=week_start,
        end_date=week_end,
    ) if supabase_token else []

    pattern_descriptions = [p.description for p in patterns] or ["No significant patterns detected."]
    habit_completion_summary = _build_habit_completion_summary(habits, habit_logs)

    if not has_week_activity:
        activity_habit_logs = len(habit_logs)
        activity_mood_logs = len(mood_logs)
        activity_habits = len(habits)
        live_burnout = await calculate_burnout_score(user_id, supabase_token or "") if supabase_token else None
        starter_burnout_score = live_burnout.score if live_burnout else burnout_score
        starter_burnout_level = live_burnout.level if live_burnout else burnout_level
        starter_pattern_signal = (
            pattern_descriptions[0]
            if pattern_descriptions and pattern_descriptions[0] != "No significant patterns detected."
            else "Not enough recent check-ins to detect a reliable pattern yet."
        )
        starter_recommendations = [
            "Log at least one habit check-in each day this week.",
            "Add a quick evening mood + stress check-in (under 60 seconds).",
            "Set tomorrow's top 2 priorities before ending today.",
        ]
        starter_summary = (
            f"For {week_start.isoformat()} to {week_end.isoformat()}, your weekly activity is still early-stage "
            f"({activity_habits} active habits, {activity_habit_logs} habit logs, {activity_mood_logs} mood logs).\n\n"
            f"Current burnout signal is {starter_burnout_level} ({starter_burnout_score}/100). "
            f"Top pattern signal right now: {starter_pattern_signal}\n"
            "Once you log a few days of habits and mood, I will generate a richer personalized weekly analysis."
        )

        db_payload = {
            "user_id": user_id,
            "week_start": week_start.isoformat(),
            "week_end": week_end.isoformat(),
            "summary_text": starter_summary,
            "recommendations": starter_recommendations,
            "burnout_risk_score": starter_burnout_score,
            "burnout_risk_level": starter_burnout_level,
            "patterns_detected": pattern_descriptions,
        }

        try:
            writer = get_supabase_user_client(supabase_token) if supabase_token else supabase
            writer.table("ai_summaries").upsert(db_payload, on_conflict="user_id,week_start").execute()
        except Exception:
            pass

        return SummaryResponse(
            summary_text=starter_summary,
            recommendations=starter_recommendations,
            burnout_risk_score=starter_burnout_score,
            burnout_risk_level=starter_burnout_level,
            patterns_detected=pattern_descriptions,
        )

    prompt = f"""
You are a personal wellness and productivity coach.
Analyze this week's data and generate a structured report.

User Data for week {week_start.isoformat()} to {week_end.isoformat()}:
- Habits completed:
{habit_completion_summary}
- Average mood: {_safe_mean(mood_vals)}/10
- Average productivity: {_safe_mean(prod_vals)}/10
- Average stress: {_safe_mean(stress_vals)}/10
- Average energy: {_safe_mean(energy_vals)}/10
- Burnout risk: {burnout_level} ({burnout_score}/100)
- Patterns detected: {pattern_descriptions}

Generate:
1. A warm, motivating 3-paragraph weekly summary
2. Top 3 specific, actionable recommendations (as JSON array)
3. One thing done well this week
4. One area to focus on next week

Respond in JSON format:
{{
  "summary": "...",
  "recommendations": ["...", "...", "..."],
  "well_done": "...",
  "focus_next_week": "..."
}}
"""

    summary_text = ""
    recommendations: list[str] = []
    try:
        raw_content = await _model_chat_completion(
            messages=[
                {"role": "system", "content": "You are a helpful and empathetic wellness coach."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.4,
        )
        if not raw_content:
            raise ValueError("Empty AI summary content")

        parsed = _extract_json(raw_content)
        summary_text = (
            f"{parsed.get('summary', '').strip()}\n\n"
            f"Well done: {parsed.get('well_done', 'N/A').strip()}\n"
            f"Focus next week: {parsed.get('focus_next_week', 'N/A').strip()}"
        ).strip()
        recommendations = [str(item).strip() for item in parsed.get("recommendations", []) if str(item).strip()][:3]
    except Exception as exc:
        logger.warning("AI weekly summary model failed; using fallback summary. Error: %s", exc)
        avg_mood = _safe_mean(mood_vals)
        avg_productivity = _safe_mean(prod_vals)
        avg_stress = _safe_mean(stress_vals)
        summary_text = _build_fallback_weekly_summary(
            week_start=week_start,
            week_end=week_end,
            burnout_level=burnout_level,
            burnout_score=burnout_score,
            avg_mood=avg_mood,
            avg_productivity=avg_productivity,
            avg_stress=avg_stress,
            pattern_descriptions=pattern_descriptions,
        )
        recommendations = _build_fallback_recommendations(
            burnout_level=burnout_level,
            avg_stress=avg_stress,
            avg_productivity=avg_productivity,
            avg_mood=avg_mood,
        )

    if not recommendations:
        recommendations = _build_fallback_recommendations(
            burnout_level=burnout_level,
            avg_stress=_safe_mean(stress_vals),
            avg_productivity=_safe_mean(prod_vals),
            avg_mood=_safe_mean(mood_vals),
        )

    db_payload = {
        "user_id": user_id,
        "week_start": week_start.isoformat(),
        "week_end": week_end.isoformat(),
        "summary_text": summary_text,
        "recommendations": recommendations,
        "burnout_risk_score": burnout_score,
        "burnout_risk_level": burnout_level,
        "patterns_detected": pattern_descriptions,
    }

    try:
        writer = get_supabase_user_client(supabase_token) if supabase_token else supabase
        writer.table("ai_summaries").upsert(db_payload, on_conflict="user_id,week_start").execute()
    except Exception:
        pass

    return SummaryResponse(
        summary_text=summary_text,
        recommendations=recommendations,
        burnout_risk_score=burnout_score,
        burnout_risk_level=burnout_level,
        patterns_detected=pattern_descriptions,
    )



def _build_recent_context(
    habits: list[dict[str, Any]],
    habit_logs: list[dict[str, Any]],
    mood_logs: list[dict[str, Any]],
    burnout_score: int,
    burnout_level: str,
) -> tuple[str, str, str]:
    habit_name_map = {str(h["id"]): h.get("name", "Habit") for h in habits}
    completion_by_habit: defaultdict[str, int] = defaultdict(int)
    for log in habit_logs:
        completion_by_habit[str(log["habit_id"])] += 1

    if completion_by_habit:
        habit_lines = [f"- {habit_name_map.get(hid, 'Habit')}: {count} logs" for hid, count in completion_by_habit.items()]
        habit_summary = "\n".join(habit_lines)
    else:
        habit_summary = "No habit logs in the last 7 days."

    if mood_logs:
        mood_summary = (
            f"Average mood { _safe_mean([_to_float(x.get('mood_score'), 0.0) for x in mood_logs]) }/10, "
            f"productivity { _safe_mean([_to_float(x.get('productivity_score'), 0.0) for x in mood_logs]) }/10, "
            f"stress { _safe_mean([_to_float(x.get('stress_score'), 0.0) for x in mood_logs]) }/10."
        )
    else:
        mood_summary = "No mood logs in the last 7 days."

    burnout_status = f"Burnout risk currently appears {burnout_level} ({burnout_score}/100)."

    return habit_summary, mood_summary, burnout_status


async def chat_with_coach(
    user_id: str,
    supabase_token: str,
    messages: list[ChatMessage],
) -> ChatResponse:
    if not messages:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="At least one chat message is required")

    end_date = date.today()
    start_date = end_date - timedelta(days=6)

    habits, habit_logs, mood_logs = await _fetch_week_data(user_id, start_date, end_date, supabase_token)
    burnout = await calculate_burnout_score(user_id, supabase_token)
    last_user_message = next((msg.content for msg in reversed(messages) if msg.role == "user"), "")
    deterministic_reply = _build_intent_coach_reply(last_user_message, burnout.level, burnout.score)
    if deterministic_reply:
        reply = deterministic_reply
        try:
            writer = get_supabase_user_client(supabase_token)
            rows_to_insert = [{"user_id": user_id, "role": "user", "content": last_user_message}]
            rows_to_insert.append({"user_id": user_id, "role": "assistant", "content": reply})
            writer.table("coach_conversations").insert(rows_to_insert).execute()
        except Exception:
            pass
        return ChatResponse(
            reply=reply,
            suggestions=[
                "What should I prioritize tomorrow to lower stress?",
                "Can you help me design a 15-minute evening reset routine?",
                "Which one habit gives me the biggest productivity lift?",
            ],
        )

    habit_summary, mood_summary, burnout_status = _build_recent_context(
        habits,
        habit_logs,
        mood_logs,
        burnout_score=burnout.score,
        burnout_level=burnout.level,
    )

    system_prompt = f"""
You are an empathetic AI wellness coach named Aria. You have access to the user's recent habit and mood data.
Be supportive, specific, and actionable. Reference their actual data when giving advice.
Keep responses concise (2-3 paragraphs max).

User's recent data context:
{habit_summary}
{mood_summary}
{burnout_status}
"""

    api_messages = [{"role": "system", "content": system_prompt}]
    api_messages.extend([{"role": msg.role, "content": msg.content} for msg in messages])

    try:
        reply = await _model_chat_completion(messages=api_messages, temperature=0.5)
        if not reply.strip():
            raise ValueError("Empty AI chat reply")
    except Exception as exc:
        logger.warning("AI coach model failed; using fallback reply. Error: %s", exc)
        reply = _build_fallback_coach_reply(
            user_message=last_user_message,
            burnout_level=burnout.level,
            burnout_score=burnout.score,
            habits=habits,
            habit_logs=habit_logs,
            mood_logs=mood_logs,
        )

    try:
        writer = get_supabase_user_client(supabase_token)
        latest_user_message = next((msg.content for msg in reversed(messages) if msg.role == "user"), "")
        rows_to_insert = []
        if latest_user_message:
            rows_to_insert.append({"user_id": user_id, "role": "user", "content": latest_user_message})
        rows_to_insert.append({"user_id": user_id, "role": "assistant", "content": reply})
        writer.table("coach_conversations").insert(rows_to_insert).execute()
    except Exception:
        pass

    suggestions = [
        "What should I prioritize tomorrow to lower stress?",
        "Can you help me design a 15-minute evening reset routine?",
        "Which one habit gives me the biggest productivity lift?",
    ]

    return ChatResponse(reply=reply, suggestions=suggestions)


async def get_weekly_summaries(
    user_id: str,
    supabase_token: str,
    limit: int = 10,
) -> list[WeeklySummaryRecord]:
    client = get_supabase_user_client(supabase_token)
    response = (
        client.table("ai_summaries")
        .select("*")
        .eq("user_id", user_id)
        .order("week_start", desc=True)
        .limit(limit)
        .execute()
    )
    return [WeeklySummaryRecord(**row) for row in (response.data or [])]


async def get_coach_history(user_id: str, supabase_token: str, limit: int = 50) -> list[CoachConversationMessage]:
    client = get_supabase_user_client(supabase_token)
    response = (
        client.table("coach_conversations")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .limit(limit)
        .execute()
    )
    rows = list(reversed(response.data or []))
    return [CoachConversationMessage(**row) for row in rows]


async def clear_coach_history(user_id: str, supabase_token: str) -> ClearHistoryResponse:
    client = get_supabase_user_client(supabase_token)
    response = client.table("coach_conversations").delete().eq("user_id", user_id).execute()
    deleted_count = len(response.data) if isinstance(response.data, list) else 0
    return ClearHistoryResponse(deleted_count=deleted_count)
