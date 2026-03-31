import { addDays, parseISO } from "date-fns";

export const detectLocalPatterns = (habitLogs = [], moodLogs = []) => {
  const patterns = [];

  const stressStreak = [];
  let currentStress = 0;
  moodLogs.forEach((log) => {
    if (log.stress_score > 7) {
      currentStress += 1;
      stressStreak.push(currentStress);
    } else {
      currentStress = 0;
    }
  });
  const maxStress = stressStreak.length ? Math.max(...stressStreak) : 0;
  if (maxStress >= 3) {
    patterns.push({
      pattern_type: "Burnout Precursor",
      description: `${maxStress} consecutive high-stress days detected`,
      severity: "high",
      detected_on: new Date().toISOString().slice(0, 10),
    });
  }

  const moodByDate = Object.fromEntries(moodLogs.map((m) => [m.logged_date, m]));
  const exerciseDates = habitLogs.filter((h) => h.category === "exercise").map((h) => h.logged_date);
  const nextDayMood = exerciseDates
    .map((d) => moodByDate[addDays(parseISO(d), 1).toISOString().slice(0, 10)]?.mood_score)
    .filter(Boolean);

  if (nextDayMood.length >= 3) {
    const avg = nextDayMood.reduce((a, b) => a + b, 0) / nextDayMood.length;
    if (avg > 6.5) {
      patterns.push({
        pattern_type: "Exercise-Mood",
        description: "Exercise tends to improve next-day mood for you",
        severity: "moderate",
        detected_on: new Date().toISOString().slice(0, 10),
      });
    }
  }

  return patterns;
};
