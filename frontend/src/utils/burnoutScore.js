export const calculateLocalBurnoutScore = (moodLogs = [], habitLogs = []) => {
  let score = 0;
  const factors = [];

  let highStress = 0;
  let lowMood = 0;
  let lowProductivity = 0;

  moodLogs.slice(-14).forEach((log) => {
    if (log.stress_score >= 7) {
      score += 15;
      highStress += 1;
    }
    if (log.stress_score <= 3) score -= 4;
    if (log.mood_score < 4) {
      score += 10;
      lowMood += 1;
    }
    if (log.productivity_score < 4) {
      score += 8;
      lowProductivity += 1;
    }
  });

  const completionRate = habitLogs.length > 0 ? Math.min(1, habitLogs.length / 70) : 0;
  if (completionRate > 0.8) {
    score -= 10;
    factors.push("Strong habit completion trend");
  }

  if (highStress) factors.push(`High stress on ${highStress} days`);
  if (lowMood) factors.push(`Low mood on ${lowMood} days`);
  if (lowProductivity) factors.push(`Low productivity on ${lowProductivity} days`);

  score = Math.max(0, Math.min(100, score));

  let level = "low";
  if (score > 75) level = "critical";
  else if (score > 50) level = "high";
  else if (score > 25) level = "moderate";

  return { score, level, factors };
};
