import { useMemo, useState } from "react";
import MoodChart from "../components/mood/MoodChart";
import MoodSlider from "../components/mood/MoodSlider";
import EmptyState from "../components/ui/EmptyState";
import { useLogMood, useMoodLogs } from "../hooks/useMood";
import { getLastNDaysISO, getTodayISO } from "../utils/dateHelpers";
import { Activity, Zap, TrendingUp, AlertCircle, Smile, MessageSquare, ChevronRight, Calendar } from "lucide-react";
import { format, parseISO } from "date-fns";

const emojiScale = ["😣", "😟", "😕", "😐", "🙂", "😊", "😄", "😁", "🤩", "🚀"];

export default function MoodTracker() {
  const { startDate, endDate } = getLastNDaysISO(30);
  const { data: moodLogs = [], isLoading } = useMoodLogs(startDate, endDate);
  const logMood = useLogMood();

  const today = getTodayISO();
  const todayEntry = moodLogs.find((item) => item.logged_date === today);

  const [form, setForm] = useState({
    mood_score: 6,
    productivity_score: 6,
    energy_score: 6,
    stress_score: 4,
    notes: "",
  });

  const submit = (e) => {
    e.preventDefault();
    logMood.mutate({ ...form, logged_date: today });
  };

  const weeklyAverages = useMemo(() => {
    const last7 = moodLogs.filter(row => {
      const date = new Date(row.logged_date);
      const todayDate = new Date();
      return (todayDate - date) / (1000 * 60 * 60 * 24) <= 7;
    });
    
    if (!last7.length) return null;
    const avg = (key) => (last7.reduce((acc, row) => acc + row[key], 0) / last7.length).toFixed(1);
    return {
      mood: avg("mood_score"),
      productivity: avg("productivity_score"),
      energy: avg("energy_score"),
      stress: avg("stress_score"),
    };
  }, [moodLogs]);

  const recentHistory = moodLogs.slice(-7).reverse().map((row) => ({
    date: row.logged_date,
    mood: row.mood_score,
    emoji: emojiScale[Math.max(0, Math.min(9, row.mood_score - 1))],
    color: row.mood_score >= 7 ? "text-success bg-success/10 ring-success/20" : row.mood_score >= 4 ? "text-warning bg-warning/10 ring-warning/20" : "text-danger bg-danger/10 ring-danger/20",
  }));

  return (
    <div className="space-y-8 animate-floatIn pb-10">
      <header className="flex flex-col gap-2">
        <h1 className="font-display text-4xl">Reflection & Energy</h1>
        <p className="text-white/50">Track your mental state and energy levels to optimize your performance.</p>
      </header>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Main: Chart and Form */}
        <div className="space-y-6 lg:col-span-8">
          
          <div className="grid gap-6 sm:grid-cols-2">
             {!todayEntry ? (
              <form onSubmit={submit} className="glass-card flex flex-col justify-between rounded-3xl p-6 ring-1 ring-white/10 sm:col-span-2 lg:col-span-1">
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-brand-500/10 p-3 text-brand-500">
                      <TrendingUp size={24} />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">Daily Check-in</h2>
                      <p className="text-xs text-white/40 uppercase tracking-widest">{format(new Date(), "MMM d, yyyy")}</p>
                    </div>
                  </div>

                  <div className="space-y-5">
                    <MoodSlider label="Mood" icon={<Smile size={14} />} value={form.mood_score} onChange={(v) => setForm((s) => ({ ...s, mood_score: v }))} />
                    <MoodSlider label="Productivity" icon={<Zap size={14} />} value={form.productivity_score} onChange={(v) => setForm((s) => ({ ...s, productivity_score: v }))} />
                    <MoodSlider label="Energy" icon={<Activity size={14} />} value={form.energy_score} onChange={(v) => setForm((s) => ({ ...s, energy_score: v }))} />
                    <MoodSlider label="Stress" icon={<AlertCircle size={14} />} value={form.stress_score} onChange={(v) => setForm((s) => ({ ...s, stress_score: v }))} />
                  </div>

                  <div className="relative group">
                    <div className="absolute left-3 top-3 text-white/30 group-focus-within:text-brand-400 transition-colors">
                      <MessageSquare size={16} />
                    </div>
                    <textarea
                      placeholder="How has your day been?"
                      value={form.notes}
                      onChange={(e) => setForm((s) => ({ ...s, notes: e.target.value }))}
                      className="h-28 w-full rounded-2xl bg-white/5 pl-10 pr-4 py-3 text-sm outline-none ring-1 ring-white/10 focus:ring-brand-500 transition-all placeholder:text-white/20"
                    />
                  </div>
                </div>

                <button 
                  disabled={logMood.isPending} 
                  className="mt-6 w-full flex items-center justify-center gap-2 rounded-2xl bg-brand-500 py-4 font-bold text-white shadow-lg shadow-brand-500/20 hover:bg-brand-600 active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {logMood.isPending ? "Logging..." : "Complete Entry"}
                  <ChevronRight size={18} />
                </button>
              </form>
            ) : (
              <div className="glass-card flex min-h-[400px] flex-col items-center justify-center rounded-3xl p-12 text-center sm:col-span-2 lg:col-span-1">
                <div className="rounded-full bg-success/10 p-4 text-success ring-1 ring-success/20">
                  <Smile size={32} />
                </div>
                <h3 className="mt-4 text-xl font-bold">Reflection Saved</h3>
                <p className="mt-2 text-sm text-white/50 max-w-xs">You've already completed your mental check-in for today. Come back tomorrow!</p>
                <div className="mt-8 grid grid-cols-2 gap-3 w-full max-w-xs">
                  <div className="glass-card rounded-2xl p-3 bg-white/5 ring-1 ring-white/10">
                    <p className="text-[10px] text-white/30 uppercase font-bold">Mood</p>
                    <p className="text-xl font-bold">{todayEntry.mood_score}</p>
                  </div>
                   <div className="glass-card rounded-2xl p-3 bg-white/5 ring-1 ring-white/10">
                    <p className="text-[10px] text-white/30 uppercase font-bold">Stress</p>
                    <p className="text-xl font-bold text-danger">{todayEntry.stress_score}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="glass-card flex flex-col justify-between rounded-3xl p-6 ring-1 ring-white/10 sm:col-span-2 lg:col-span-1">
              <div>
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Activity size={18} className="text-brand-400" />
                  Weekly Averages
                </h3>
                <p className="text-xs text-white/40">Performance based on the last 7 entries.</p>
                
                <div className="mt-8 space-y-4">
                  <MetricRow label="Avg Mood" value={weeklyAverages?.mood || '-'} color="brand" />
                  <MetricRow label="Avg Energy" value={weeklyAverages?.energy || '-'} color="cyan" />
                  <MetricRow label="Avg Productivity" value={weeklyAverages?.productivity || '-'} color="success" />
                  <MetricRow label="Avg Stress" value={weeklyAverages?.stress || '-'} color="danger" />
                </div>
              </div>

              <div className="mt-8 p-4 rounded-2xl bg-brand-500/5 ring-1 ring-brand-500/10">
                <p className="text-xs text-brand-300 font-medium italic">"Consistency in reflection leads to clarity of purpose."</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-8">
            {isLoading ? (
              <div className="skeleton h-96 rounded-3xl" />
            ) : (
              <MoodChart data={moodLogs} />
            )}
          </div>
        </div>

        {/* Sidebar: Stats and History */}
        <aside className="space-y-6 lg:col-span-4">
          <div className="glass-card space-y-4 rounded-3xl p-6 ring-1 ring-white/10 overflow-hidden relative">
            <div className="absolute -right-4 -top-4 opacity-5">
              <Calendar size={120} />
            </div>
            
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Calendar size={18} className="text-brand-400" />
              Recent History
            </h3>
            
            <div className="space-y-3 relative z-10">
              {recentHistory.map((item) => (
                <div key={item.date} className="group flex items-center justify-between rounded-2xl border border-white/5 bg-white/5 p-3 hover:bg-white/10 transition-all cursor-default">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl ring-1 ${item.color} text-xl transition-all group-hover:scale-110`}>
                      {item.emoji}
                    </div>
                    <div>
                      <p className="text-sm font-bold">{format(parseISO(item.date), "EEEE")}</p>
                      <p className="text-[10px] text-white/40">{format(parseISO(item.date), "MMM d")}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold">{item.mood}/10</span>
                  </div>
                </div>
              ))}
              {!recentHistory.length ? (
                <div className="py-10 text-center opacity-40">
                  <p className="text-sm">No entries yet this week.</p>
                </div>
              ) : null}
            </div>
          </div>

          <div className="glass-card rounded-3xl p-6 ring-1 ring-white/10 bg-gradient-to-br from-brand-600/10 to-transparent">
             <h3 className="text-lg font-bold flex items-center gap-2 text-white">
              <AlertCircle size={18} className="text-brand-400" />
              Reflective Tip
            </h3>
            <p className="mt-4 text-sm text-white/70 leading-relaxed">
              Tracking your mood alongside productivity helps you identify **"High Velocity"** windows. Try to schedule demanding tasks when your energy score is above 7.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

function MetricRow({ label, value, color }) {
  const colorMap = {
    brand: "bg-brand-500",
    success: "bg-success",
    danger: "bg-danger",
    cyan: "bg-cyan-500",
  };
  
  const textColorMap = {
    brand: "text-brand-300",
    success: "text-success",
    danger: "text-danger",
    cyan: "text-cyan-400",
  };

  return (
    <div className="flex items-center justify-between group">
      <div className="flex items-center gap-2">
        <div className={`h-1.5 w-1.5 rounded-full ${colorMap[color]} shadow-[0_0_8px_rgba(255,255,255,0.2)]`} />
        <span className="text-sm font-medium text-white/60 group-hover:text-white transition-colors">{label}</span>
      </div>
      <span className={`text-sm font-bold ${textColorMap[color]}`}>{value}</span>
    </div>
  );
}

