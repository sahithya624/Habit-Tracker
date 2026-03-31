import { useQuery } from "@tanstack/react-query";
import { fetchAnalyticsDashboard, fetchBurnout, fetchPatterns, fetchProductivityCycle } from "../api/analytics";

export const useAnalyticsDashboard = () =>
  useQuery({ queryKey: ["analytics", "dashboard"], queryFn: fetchAnalyticsDashboard });

export const usePatterns = (days = 30) =>
  useQuery({ queryKey: ["analytics", "patterns", days], queryFn: () => fetchPatterns(days) });

export const useBurnout = () => useQuery({ queryKey: ["analytics", "burnout"], queryFn: fetchBurnout });

export const useProductivityCycle = (days = 30) =>
  useQuery({
    queryKey: ["analytics", "productivity-cycle", days],
    queryFn: () => fetchProductivityCycle(days),
  });
