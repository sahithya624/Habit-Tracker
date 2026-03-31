import api from "./axios";

const AI_TIMEOUT_MS = 120_000;

export const generateWeeklySummary = async (payload) => {
  const { data } = await api.post("/ai/weekly-summary", payload, { timeout: AI_TIMEOUT_MS });
  return data;
};

export const fetchWeeklySummaries = async () => {
  const { data } = await api.get("/ai/weekly-summaries", { timeout: AI_TIMEOUT_MS });
  return data;
};

export const coachChat = async (payload) => {
  const { data } = await api.post("/ai/coach", payload, { timeout: AI_TIMEOUT_MS });
  return data;
};

export const fetchCoachHistory = async () => {
  const { data } = await api.get("/ai/coach/history", { timeout: AI_TIMEOUT_MS });
  return data;
};

export const clearCoachHistory = async () => {
  const { data } = await api.delete("/ai/coach/history", { timeout: AI_TIMEOUT_MS });
  return data;
};
