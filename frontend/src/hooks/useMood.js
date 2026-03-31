import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { fetchMoodLogs, fetchMoodTrends, logMood } from "../api/mood";

export const useMoodLogs = (startDate, endDate) =>
  useQuery({
    queryKey: ["mood-logs", startDate, endDate],
    queryFn: () => fetchMoodLogs({ startDate, endDate }),
  });

export const useMoodTrends = (days = 30) =>
  useQuery({
    queryKey: ["mood-trends", days],
    queryFn: () => fetchMoodTrends(days),
  });

export const useLogMood = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: logMood,
    onSuccess: () => {
      toast.success("Mood saved", { style: { background: "#0b2e22", color: "#8ff0c6" } });
      queryClient.invalidateQueries({ queryKey: ["mood-logs"] });
      queryClient.invalidateQueries({ queryKey: ["mood-trends"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.error?.message || "Could not save mood", {
        style: { background: "#3a0f1a", color: "#ffd2db" },
      });
    },
  });
};
