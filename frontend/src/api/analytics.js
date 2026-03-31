import api from "./axios";

const ANALYTICS_TIMEOUT_MS = 60_000;

export const fetchAnalyticsDashboard = async () => {
  const { data } = await api.get("/analytics/dashboard", { timeout: ANALYTICS_TIMEOUT_MS });
  return data;
};

export const fetchPatterns = async (days = 30) => {
  const { data } = await api.get("/analytics/patterns", {
    params: { days },
    timeout: ANALYTICS_TIMEOUT_MS,
  });
  return data;
};

export const fetchBurnout = async () => {
  const { data } = await api.get("/analytics/burnout", { timeout: ANALYTICS_TIMEOUT_MS });
  return data;
};

export const fetchProductivityCycle = async (days = 30) => {
  const { data } = await api.get("/analytics/productivity-cycle", {
    params: { days },
    timeout: ANALYTICS_TIMEOUT_MS,
  });
  return data;
};
