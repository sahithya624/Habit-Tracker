import { eachDayOfInterval, format, parseISO } from "date-fns";
import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useHabits, useAllHabitLogs, useLogHabit } from "../hooks/useHabits";
import { useMoodLogs } from "../hooks/useMood";
import { useAnalyticsDashboard } from "../hooks/useAnalytics";
import { useAuthStore } from "../store/authStore";
import { getLastNDaysISO, getTodayISO } from "../utils/dateHelpers";
import EmptyState from "../components/ui/EmptyState";

const circleStroke = (level) => {
  if (level === "critical") return "#f43f5e";
  if (level === "high") return "#f97316";
  if (level === "moderate") return "#f59e0b";
  return "#10b981";
};

const shortDate = (iso) => {
  try {
    return format(parseISO(iso), "MMM d");
  } catch {
    return iso;
  }
};

export default function Dashboard() {
  const user = useAuthStore((state) => state.user);
  const { startDate: start14, endDate: end14 } = getLastNDaysISO(14);
  const { startDate: start7, endDate: end7 } = getLastNDaysISO(7);

  const { data: habits = [], isLoading: habitsLoading } = useHabits();
  const { data: logs7 = [] } = useAllHabitLogs(start7, end7);
  const { data: mood14 = [] } = useMoodLogs(start14, end14);
  const { data: analytics, isLoading: analyticsLoading } = useAnalyticsDashboard();
  const logHabit = useLogHabit();

  const today = getTodayISO();

  const doneTodaySet = useMemo(() => {
    const todayLogs = logs7.filter((item) => item.logged_date === today);
    return new Set(todayLogs.map((item) => item.habit_id));
  }, [logs7, today]);

  const completionData = useMemo(() => {
    const grouped = {};
    logs7.forEach((log) => {
      grouped[log.logged_date] = (grouped[log.logged_date] || 0) + 1;
    });

    const interval = eachDayOfInterval({ start: new Date(start7), end: new Date(end7) });
    return interval.map((day) => {
      const date = format(day, "yyyy-MM-dd");
      return { date, completed: grouped[date] || 0 };
    });
  }, [logs7, start7, end7]);

  const trendsData = useMemo(() => {
    const byDate = mood14.reduce((acc, row) => {
      acc[row.logged_date] = row;
      return acc;
    }, {});

    const interval = eachDayOfInterval({ start: new Date(start14), end: new Date(end14) });
    return interval.map((day) => {
      const date = format(day, "yyyy-MM-dd");
      const row = byDate[date];
      return {
        date,
        mood: row ? Number(row.mood_score) : null,
        productivity: row ? Number(row.productivity_score) : null,
      };
    });
  }, [mood14, start14, end14]);

  const todayMoodScore = mood14.find((m) => m.logged_date === today)?.mood_score;
  const todayMood = todayMoodScore ? `${todayMoodScore}/10` : "--";
  const activeBestStreak = Math.max(0, ...(analytics?.streaks || []).map((item) => Number(item.current_streak || 0)));
  const hasCompletionData = completionData.some((row) => row.completed > 0);
  const hasMoodData = trendsData.some((row) => row.mood !== null || row.productivity !== null);

  const onQuickLog = (habit) => {
    logHabit.mutate({ habit_id: habit.id, logged_date: today, value: 1, notes: "Quick log from dashboard" });
  };

  if (habitsLoading) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-10 w-72" />
        <div className="grid gap-4 md:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-28" />)}</div>
        <div className="grid gap-4 md:grid-cols-2">{Array.from({ length: 2 }).map((_, i) => <div key={i} className="skeleton h-72" />)}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section>
        <h1 className="font-display text-3xl">Hi {user?.full_name || "there"}</h1>
        <p className="text-white/60">{format(new Date(), "EEEE, MMMM d")}</p>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <div className="glass-card rounded-2xl p-4">
          <p className="text-sm text-white/60">Today's Habit Completion</p>
          <p className="mt-2 text-2xl font-semibold">
            {doneTodaySet.size}/{habits.length}
          </p>
        </div>
        <div className="glass-card rounded-2xl p-4">
          <p className="text-sm text-white/60">Current Streak</p>
          <p className="mt-2 text-2xl font-semibold text-warning">{activeBestStreak} days</p>
        </div>
        <div className="glass-card rounded-2xl p-4">
          <p className="text-sm text-white/60">Today's Mood</p>
          <p className="mt-2 text-2xl font-semibold">{todayMood}</p>
        </div>
        <div className="glass-card rounded-2xl p-4">
          <p className="text-sm text-white/60">Burnout Risk</p>
          <span
            className={`mt-2 inline-flex rounded-full px-3 py-1 text-sm capitalize ${
              analytics?.burnout?.level === "critical"
                ? "bg-danger/20 text-danger"
                : analytics?.burnout?.level === "high"
                  ? "bg-warning/20 text-warning"
                  : analytics?.burnout?.level === "moderate"
                    ? "bg-warning/20 text-warning"
                    : "bg-success/20 text-success"
            }`}
          >
            {analyticsLoading ? "loading..." : analytics?.burnout?.level || "low"}
          </span>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="glass-card rounded-2xl p-4">
          <h3 className="mb-3 text-lg font-semibold">Habit Completion (7d)</h3>
          {hasCompletionData ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={completionData}>
                  <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                  <XAxis dataKey="date" tickFormatter={shortDate} stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" allowDecimals={false} domain={[0, Math.max(1, habits.length)]} />
                  <Tooltip labelFormatter={(label) => shortDate(String(label))} />
                  <Bar dataKey="completed" fill="#6366f1" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex h-64 items-center justify-center text-sm text-white/50">
              No check-ins in the last 7 days yet.
            </div>
          )}
        </div>

        <div className="glass-card rounded-2xl p-4">
          <h3 className="mb-3 text-lg font-semibold">Mood + Productivity (14d)</h3>
          {hasMoodData ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendsData}>
                  <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                  <XAxis dataKey="date" tickFormatter={shortDate} stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" domain={[0, 10]} allowDecimals={false} />
                  <Tooltip labelFormatter={(label) => shortDate(String(label))} />
                  <Line type="monotone" dataKey="mood" stroke="#6366f1" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="productivity" stroke="#10b981" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex h-64 items-center justify-center text-sm text-white/50">
              No mood logs in the last 14 days yet.
            </div>
          )}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="glass-card rounded-2xl p-4 lg:col-span-2">
          <h3 className="mb-3 text-lg font-semibold">Today's Habits</h3>
          {habits.length === 0 ? (
            <EmptyState title="No habits yet" description="Create your first habit in the Habits page." />
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {habits.map((habit) => {
                const done = doneTodaySet.has(habit.id);
                return (
                  <label key={habit.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3">
                    <div>
                      <p className="font-medium">
                        {habit.icon} {habit.name}
                      </p>
                      <p className="text-xs text-white/60">{done ? "Done" : "Pending"}</p>
                    </div>
                    <input type="checkbox" checked={done} onChange={() => !done && onQuickLog(habit)} className="h-4 w-4 accent-brand-500" />
                  </label>
                );
              })}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="glass-card rounded-2xl p-4">
            <h3 className="text-lg font-semibold">Latest AI Insights</h3>
            <div className="mt-3 space-y-2 text-sm text-white/75">
              {(analytics?.patterns || []).slice(0, 2).map((p, idx) => {
                return (
                  <p key={`${p.pattern_type}-${idx}`} className="leading-relaxed">
                    - {p.description}
                  </p>
                );
              })}
              {!analytics?.patterns?.length ? <p>No patterns yet. Keep logging for richer insights.</p> : null}
            </div>
          </div>

          <div className="glass-card rounded-2xl p-4">
            <h3 className="text-lg font-semibold">Mini Burnout Meter</h3>
            <div className="mt-3 flex items-center gap-3">
              <svg width="70" height="70">
                <circle cx="35" cy="35" r="28" stroke="rgba(255,255,255,0.15)" strokeWidth="8" fill="none" />
                <circle
                  cx="35"
                  cy="35"
                  r="28"
                  stroke={circleStroke(analytics?.burnout?.level)}
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={176}
                  strokeDashoffset={176 - ((analytics?.burnout?.score || 0) / 100) * 176}
                  strokeLinecap="round"
                  transform="rotate(-90 35 35)"
                />
              </svg>
              <div>
                <p className="text-2xl font-bold">{analytics?.burnout?.score || 0}</p>
                <p className="text-sm capitalize text-white/60">{analytics?.burnout?.level || "low"} risk</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
