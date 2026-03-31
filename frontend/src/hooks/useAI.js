import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { clearCoachHistory, coachChat, fetchCoachHistory, fetchWeeklySummaries, generateWeeklySummary } from "../api/ai";

const extractErrorMessage = (error, fallback) =>
  error?.response?.data?.detail || error?.response?.data?.error?.message || error?.message || fallback;

export const useWeeklySummaries = () =>
  useQuery({ queryKey: ["ai", "weekly-summaries"], queryFn: fetchWeeklySummaries });

export const useGenerateSummary = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: generateWeeklySummary,
    onSuccess: () => {
      toast.success("Weekly summary generated", { style: { background: "#0b2e22", color: "#8ff0c6" } });
      queryClient.invalidateQueries({ queryKey: ["ai", "weekly-summaries"] });
    },
    onError: (error) => {
      toast.error(extractErrorMessage(error, "Could not generate summary"), {
        style: { background: "#3a0f1a", color: "#ffd2db" },
      });
    },
  });
};

export const useCoachChat = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: coachChat,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai", "coach-history"] });
    },
    onError: (error) => {
      toast.error(extractErrorMessage(error, "Coach message failed"), {
        style: { background: "#3a0f1a", color: "#ffd2db" },
      });
    },
  });
};

export const useCoachHistory = () =>
  useQuery({ queryKey: ["ai", "coach-history"], queryFn: fetchCoachHistory });

export const useClearCoachHistory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: clearCoachHistory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai", "coach-history"] });
      toast.success("Coach chat reset", { style: { background: "#0b2e22", color: "#8ff0c6" } });
    },
    onError: (error) => {
      toast.error(extractErrorMessage(error, "Could not clear coach history"), {
        style: { background: "#3a0f1a", color: "#ffd2db" },
      });
    },
  });
};
