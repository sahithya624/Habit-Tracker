import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from "recharts";
import { Activity, Clock } from "lucide-react";

const DAY_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function ProductivityCycle({ data = {}, loading = false }) {
  const dayScores = data.day_of_week_scores || {};
  const entries = DAY_ORDER.map((day) => ({ day: day.substring(0, 3), score: Number(dayScores[day] || 0) }));
  const valid = entries.filter((entry) => entry.score > 0);

  const peak = valid.length ? valid.reduce((a, b) => (a.score > b.score ? a : b)) : null;
  const trough = valid.length ? valid.reduce((a, b) => (a.score < b.score ? a : b)) : null;
  const backendInsight = data?.time_patterns?.insight;

  const insightText = loading
    ? "Refreshing productivity rhythm for the selected window..."
    : valid.length > 1
      ? backendInsight ||
        `You're at your best on ${peak?.day}. Schedule your most intensive deep-work sessions for this window.`
      : "Continue logging your mood to uncover your weekly biological rhythm.";

  return (
    <div className="glass-card flex flex-col justify-between overflow-hidden rounded-3xl p-6 ring-1 ring-white/10">
      <div>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Clock size={20} className="text-brand-400" />
              Productivity Cycle
            </h3>
            <p className="mt-1 text-sm text-white/40">Average productivity score by day of the week.</p>
          </div>
        </div>

        <div className="mt-4 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={entries} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10, fontWeight: "bold" }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }}
                domain={[0, 10]}
              />
              <Tooltip
                cursor={{ fill: "rgba(255,255,255,0.03)" }}
                contentStyle={{
                  background: "rgba(26, 29, 46, 0.95)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "12px",
                  backdropFilter: "blur(10px)",
                  fontSize: "12px",
                }}
              />
              <Bar dataKey="score" radius={[6, 6, 0, 0]} barSize={32}>
                {entries.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.score === peak?.score ? "#10b981" : entry.score === trough?.score && valid.length > 3 ? "#f43f5e" : "#6366f1"}
                    fillOpacity={entry.score === peak?.score ? 1 : entry.score === trough?.score && valid.length > 3 ? 0.8 : 0.4}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-8 flex items-center gap-4 rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
        <div className="rounded-full bg-brand-500/20 p-2 text-brand-400">
          <Activity size={18} />
        </div>
        <p className="text-sm leading-relaxed text-white/70">{insightText}</p>
      </div>
    </div>
  );
}

