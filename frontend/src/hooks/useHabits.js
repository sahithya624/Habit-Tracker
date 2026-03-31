import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { createHabit, deleteHabit, fetchAllHabitLogs, fetchHabitLogs, fetchHabits, logHabit, updateHabit } from "../api/habits";

export const useHabits = (includeArchived = false) =>
  useQuery({
    queryKey: ["habits", { includeArchived }],
    queryFn: () => fetchHabits({ includeArchived }),
  });

export const useHabitLogs = (habitId, startDate, endDate) =>
  useQuery({
    queryKey: ["habit-logs", habitId, startDate, endDate],
    queryFn: () => fetchHabitLogs({ habitId, startDate, endDate }),
    enabled: Boolean(habitId),
  });

export const useAllHabitLogs = (startDate, endDate) =>
  useQuery({
    queryKey: ["habit-logs-all", startDate, endDate],
    queryFn: () => fetchAllHabitLogs({ startDate, endDate }),
    enabled: Boolean(startDate && endDate),
  });

export const useLogHabit = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: logHabit,
    onSuccess: () => {
      toast.success("Habit logged", { style: { background: "#0b2e22", color: "#8ff0c6" } });
      queryClient.invalidateQueries({ queryKey: ["habits"] });
      queryClient.invalidateQueries({ queryKey: ["habit-logs"] });
      queryClient.invalidateQueries({ queryKey: ["habit-logs-all"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.error?.message || "Failed to log habit", {
        style: { background: "#3a0f1a", color: "#ffd2db" },
      });
    },
  });
};

export const useCreateHabit = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createHabit,
    onSuccess: () => {
      toast.success("Habit created", { style: { background: "#0b2e22", color: "#8ff0c6" } });
      queryClient.invalidateQueries({ queryKey: ["habits"] });
    },
    onError: (error) =>
      toast.error(error.response?.data?.error?.message || "Could not create habit", {
        style: { background: "#3a0f1a", color: "#ffd2db" },
      }),
  });
};

export const useUpdateHabit = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => updateHabit(id, payload),
    onSuccess: () => {
      toast.success("Habit updated", { style: { background: "#0b2e22", color: "#8ff0c6" } });
      queryClient.invalidateQueries({ queryKey: ["habits"] });
    },
    onError: (error) =>
      toast.error(error.response?.data?.error?.message || "Could not update habit", {
        style: { background: "#3a0f1a", color: "#ffd2db" },
      }),
  });
};

export const useDeleteHabit = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteHabit,
    onSuccess: () => {
      toast.success("Habit archived", { style: { background: "#0b2e22", color: "#8ff0c6" } });
      queryClient.invalidateQueries({ queryKey: ["habits"] });
    },
    onError: (error) =>
      toast.error(error.response?.data?.error?.message || "Could not archive habit", {
        style: { background: "#3a0f1a", color: "#ffd2db" },
      }),
  });
};
