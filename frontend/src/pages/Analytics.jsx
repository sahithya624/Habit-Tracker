import { useMemo, useState } from "react";
import { Activity, List, ShieldAlert } from "lucide-react";
import PatternChart from "../components/analytics/PatternChart";
import BurnoutMeter from "../components/analytics/BurnoutMeter";
import ProductivityCycle from "../components/analytics/ProductivityCycle";
import StreakWidget from "../components/analytics/StreakWidget";
import { useAnalyticsDashboard, useBurnout, usePatterns, useProductivityCycle } from "../hooks/useAnalytics";

const TIME_RANGES = [14, 30, 90];

const capitalize = (value = "") => value.charAt(0).toUpperCase() + value.slice(1);

export default function Analytics() {
  const [days, setDays] = useState(30);
  const {
    data: dashboard,
    isLoading,
    isError: isDashboardError,
    error: dashboardError,
    refetch: refetchDashboard,
  } = useAnalyticsDashboard();
  const {
    data: burnoutData,
    isFetching: isBurnoutFetching,
    isError: isBurnoutError,
    refetch: refetchBurnout,
  } = useBurnout();
  const {
    data: patterns = [],
    refetch: refetchPatterns,
    isFetching: isPatternFetching,
    isError: isPatternsError,
  } = usePatterns(days);
  const {
    data: productivityCycle,
    refetch: refetchProductivity,
    isFetching: isProductivityFetching,
    isError: isProductivityError,
  } = useProductivityCycle(days);

  const streaks = dashboard?.streaks || [];
  const burnout = burnoutData || dashboard?.burnout;
  const hasAnyAnalyticsData =
    streaks.length > 0 ||
    patterns.length > 0 ||
    Boolean(productivityCycle?.day_of_week_scores) ||
    Boolean(burnout);

  const insights = useMemo(() => {
    const averageCompletion = streaks.length
      ? streaks.reduce((total, streak) => total + Number(streak.completion_30d || 0), 0) / streaks.length
      : 0;

    const consistencyScore = Math.round(averageCompletion * 100);
    const highRiskPatterns = patterns.filter((pattern) => pattern.severity === "high").length;

    return {
      consistencyScore,
      highRiskPatterns,
      activeHabits: streaks.length,
      burnoutScore: burnout?.score ?? 0,
      burnoutLevel: burnout?.level ?? "low",
    };
  }, [streaks, patterns, burnout]);

  const refreshWindow = async () => {
    await Promise.allSettled([refetchDashboard(), refetchBurnout(), refetchPatterns(), refetchProductivity()]);
  };

  if (isLoading && !hasAnyAnalyticsData) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 w-48 rounded-lg bg-white/5" />
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="h-[400px] rounded-3xl bg-white/5" />
          <div className="h-[400px] rounded-3xl bg-white/5" />
          <div className="h-[300px] rounded-3xl bg-white/5 lg:col-span-2" />
        </div>
      </div>
    );
  }

  const dashboardErrorMessage =
    dashboardError?.response?.data?.error?.message ||
    dashboardError?.response?.data?.detail ||
    dashboardError?.message ||
    "Dashboard analytics failed to load.";

  return (
    <div className="space-y-8 animate-floatIn pb-10">
      <header className="flex flex-col gap-3">
        <h1 className="font-display text-4xl">Deep Analytics</h1>
        <p className="text-white/50">
          Identify patterns, optimize your schedule, and prevent burnout with AI-driven insights.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {TIME_RANGES.map((range) => (
            <button
              key={range}
              onClick={() => setDays(range)}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold uppercase tracking-widest ring-1 transition-all ${
                days === range
                  ? "bg-brand-500/20 text-brand-300 ring-brand-500/30"
                  : "bg-white/5 text-white/50 ring-white/10 hover:bg-white/10 hover:text-white/80"
              }`}
            >
              {range}d window
            </button>
          ))}
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-12">
        {isDashboardError ? (
          <section className="lg:col-span-12">
            <div className="rounded-2xl border border-danger/30 bg-danger/10 p-4 text-sm text-danger">
              {String(dashboardErrorMessage)} Showing available analytics while this section retries.
            </div>
          </section>
        ) : null}

        {/* Performance Overview */}
        <section className="lg:col-span-12">
          <StreakWidget streaks={streaks} />
        </section>

        {/* Pattern & Cycle (Main row) */}
        <section className="lg:col-span-6">
          <PatternChart
            patterns={patterns}
            onRefresh={refreshWindow}
            loading={isPatternFetching || isProductivityFetching}
          />
          {isPatternsError ? (
            <p className="mt-2 text-xs text-danger/90">Pattern data could not be loaded for this window.</p>
          ) : null}
        </section>

        <section className="lg:col-span-6">
          <ProductivityCycle
            data={productivityCycle || dashboard?.productivity_cycle || {}}
            loading={isProductivityFetching}
          />
          {isProductivityError ? (
            <p className="mt-2 text-xs text-danger/90">Productivity cycle is temporarily unavailable.</p>
          ) : null}
        </section>

        {/* Risk Assessment */}
        <section className="lg:col-span-12">
          <BurnoutMeter burnout={burnout} />
          {isBurnoutError ? (
            <p className="mt-2 text-xs text-danger/90">Burnout score is temporarily unavailable.</p>
          ) : null}
          {isBurnoutFetching ? (
            <p className="mt-2 text-xs text-white/40">Refreshing burnout analysis...</p>
          ) : null}
        </section>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <InsightCard
          title="Consistency Score"
          value={`${insights.consistencyScore}%`}
          detail={`Average 30-day completion across ${insights.activeHabits} active habits`}
          icon={<Activity size={16} />}
        />
        <InsightCard
          title="Pattern Alerts"
          value={insights.highRiskPatterns}
          detail={`${insights.highRiskPatterns} high-severity signals in the last ${days} days`}
          icon={<List size={16} />}
        />
        <InsightCard
          title="Burnout Risk"
          value={`${insights.burnoutScore}/100`}
          detail={`${capitalize(insights.burnoutLevel)} risk based on recent 14-day signals`}
          icon={<ShieldAlert size={16} />}
        />
      </div>
    </div>
  );
}

function InsightCard({ title, value, detail, icon }) {
  return (
    <div className="glass-card rounded-2xl p-5 ring-1 ring-white/10 hover:bg-white/5 transition-colors">
      <div className="flex items-center gap-2 mb-3">
        <div className="p-1.5 rounded-lg bg-brand-500/10 text-brand-400">
          {icon}
        </div>
        <span className="text-[10px] font-bold uppercase tracking-widest text-white/30">{title}</span>
      </div>
      <div className="flex flex-col">
        <span className="text-2xl font-black text-white">{value}</span>
        <span className="text-xs text-brand-300 font-medium">{detail}</span>
      </div>
    </div>
  );
}

