import api from "./axios";

export const fetchHabits = async ({ includeArchived = false } = {}) => {
  const { data } = await api.get("/habits/", { params: { include_archived: includeArchived } });
  return data;
};

export const createHabit = async (payload) => {
  const { data } = await api.post("/habits/", payload);
  return data;
};

export const updateHabit = async (id, payload) => {
  const { data } = await api.put(`/habits/${id}`, payload);
  return data;
};

export const deleteHabit = async (id) => {
  const { data } = await api.delete(`/habits/${id}`);
  return data;
};

export const logHabit = async (payload) => {
  const { data } = await api.post("/habits/log", payload);
  return data;
};

export const fetchHabitLogs = async ({ habitId, startDate, endDate }) => {
  const { data } = await api.get(`/habits/${habitId}/logs`, { params: { start_date: startDate, end_date: endDate } });
  return data;
};

export const fetchAllHabitLogs = async ({ startDate, endDate }) => {
  const { data } = await api.get("/habits/logs/all", { params: { start_date: startDate, end_date: endDate } });
  return data;
};
