import api from "./axios";

export const logMood = async (payload) => {
  const { data } = await api.post("/mood/", payload);
  return data;
};

export const fetchMoodLogs = async ({ startDate, endDate }) => {
  const { data } = await api.get("/mood/", { params: { start_date: startDate, end_date: endDate } });
  return data;
};

export const fetchMoodTrends = async (days = 30) => {
  const { data } = await api.get("/mood/trends", { params: { days } });
  return data;
};
