import { useMemo, useState } from "react";
import CoachChat from "../components/ai/CoachChat";
import InsightCard from "../components/ai/InsightCard";
import WeeklyReport from "../components/ai/WeeklyReport";
import { useClearCoachHistory, useCoachChat, useCoachHistory, useGenerateSummary, useWeeklySummaries } from "../hooks/useAI";
import { useAnalyticsDashboard } from "../hooks/useAnalytics";
import { getCurrentWeekRange } from "../utils/dateHelpers";
import { Flame, ShieldAlert, Zap, TrendingUp, Sparkles, Wand2 } from "lucide-react";

const BURNOUT_TONE = {
  low: "success",
  moderate: "warning",
  high: "warning",
  critical: "danger",
};

const DEFAULT_SUGGESTIONS = [
  "What should I prioritize tomorrow to lower stress?",
  "Can you help me design a 15-minute evening reset routine?",
  "Which one habit gives me the biggest productivity lift?",
];

const burnoutGuidance = (level = "low") => {
  if (level === "critical") return "Risk is critical. Reduce workload this week and prioritize rest blocks daily.";
  if (level === "high") return "Risk is high. Schedule recovery time before adding new commitments.";
  if (level === "moderate") return "Risk is moderate. Add one recovery block and protect your sleep window.";
  return "Risk is low. Maintain your current cadence and review patterns weekly.";
};

const buildLocalCoachFallback = (message = "", snapshot = {}) => {
  const burnoutLevel = snapshot.burnoutLevel || "low";
  const burnoutScore = Number(snapshot.burnoutScore ?? 0);
  const topStreak = Number(snapshot.topStreak ?? 0);
  const leadPatternTitle = snapshot.leadPatternTitle || "";
  const leadPatternDescription = snapshot.leadPatternDescription || "";
  const lower = message.trim().toLowerCase();
  const contextLine =
    `Snapshot: Top Streak ${topStreak} days, Burnout ${burnoutScore}/100 (${burnoutLevel} risk)` +
    (leadPatternTitle ? `, Insight ${leadPatternTitle}.` : ".");

  if (["hi", "hello", "hey", "hi aria", "hello aria"].includes(lower)) {
    return "Hey, I am Aria. Great to see you here.\n\n" + `${contextLine}\n` + "Tell me one goal for tomorrow and I will turn it into a clear 3-step plan.";
  }

  if (lower.includes("evening") && (lower.includes("reset") || lower.includes("routine"))) {
    return (
      "Try this 15-minute evening reset:\n" +
      "1. 5 min: brain dump tomorrow's tasks.\n" +
      "2. 5 min: light stretch + slow breathing.\n" +
      "3. 5 min: prep one easy morning win (water, notebook, task list).\n\n" +
      `${contextLine}\n` +
      (leadPatternTitle === "Weekend Drop"
        ? "Since your weekend completion drops, run this routine on Friday and Saturday nights first."
        : "This reduces decision fatigue and improves next-day consistency.")
    );
  }

  if (lower.includes("priorit") || lower.includes("tomorrow")) {
    return (
      "Use this simple tomorrow plan:\n" +
      "1. Pick your top 2 must-do tasks before checking messages.\n" +
      "2. Start with a 25-minute focus block on task #1.\n" +
      "3. Add one 10-minute reset break after your hardest task.\n\n" +
      `${contextLine}\nThis keeps load manageable.`
    );
  }

  if (lower.includes("habit") && (lower.includes("productivity") || lower.includes("lift"))) {
    return (
      "For productivity lift, start with one keystone habit: a fixed first focus block daily.\n\n" +
      "Do 25 focused minutes at the same time each day before reactive work. " +
      "Track it for 7 days and we can tune the timing using your mood/productivity trend."
    );
  }

  return (
    "I could not reach the coach service right now, so here is a quick plan you can use:\n" +
    "1. Choose your top 2 priorities for tomorrow.\n" +
    "2. Finish one easy win in the first hour.\n" +
    "3. Do a 10-minute evening reset before sleep.\n\n" +
    `${contextLine}\n` +
    (leadPatternDescription ? `Focus insight: ${leadPatternDescription}\n` : "") +
    "If this keeps happening, refresh the page and retry in 1 minute."
  );
};

const normalizeMessages = (items = []) =>
  items
    .filter((msg) => msg?.content && (msg.role === "user" || msg.role === "assistant"))
    .map((msg) => ({ role: msg.role, content: msg.content }));

export default function AICoach() {
  const { data: history = [] } = useCoachHistory();
  const { data: weeklySummaries = [], isLoading: summariesLoading } = useWeeklySummaries();
  const coachMutation = useCoachChat();
  const clearHistoryMutation = useClearCoachHistory();
  const summaryMutation = useGenerateSummary();
  const { data: analytics, isLoading: analyticsLoading } = useAnalyticsDashboard();

  const [localMessages, setLocalMessages] = useState([]);
  const [useSavedHistory, setUseSavedHistory] = useState(true);
  const [suggestions, setSuggestions] = useState(DEFAULT_SUGGESTIONS);

  const savedMessages = useMemo(
    () => normalizeMessages(history.map((message) => ({ role: message.role, content: message.content }))),
    [history]
  );

  const mergedMessages = useMemo(() => {
    if (localMessages.length) return localMessages;
    return useSavedHistory ? savedMessages : [];
  }, [localMessages, savedMessages, useSavedHistory]);

  const sendMessage = (content) => {
    const trimmed = content.trim();
    if (!trimmed || coachMutation.isPending) return;

    const outgoing = { role: "user", content: trimmed };
    const requestMessages = normalizeMessages([...mergedMessages, outgoing]).slice(-12);

    setUseSavedHistory(false);
    setLocalMessages((prev) => (prev.length ? [...prev, outgoing] : [...mergedMessages, outgoing]));

    coachMutation.mutate(
      { messages: requestMessages },
      {
        onSuccess: (data) => {
          setLocalMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
          setSuggestions(data.suggestions?.length ? data.suggestions : DEFAULT_SUGGESTIONS);
        },
        onError: () => {
          const fallbackReply = buildLocalCoachFallback(trimmed, {
            topStreak: Number(topStreak) || 0,
            burnoutScore: burnoutScore ?? 0,
            burnoutLevel,
            leadPatternTitle: leadPattern?.pattern_type || "",
            leadPatternDescription: leadPattern?.description || "",
          });
          setLocalMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: fallbackReply,
            },
          ]);
          setSuggestions(DEFAULT_SUGGESTIONS);
        },
      }
    );
  };

  const clearConversation = () => {
    setUseSavedHistory(false);
    setLocalMessages([]);
    setSuggestions(DEFAULT_SUGGESTIONS);
    clearHistoryMutation.mutate();
  };

  const generateSummary = () => {
    const { weekStart } = getCurrentWeekRange();
    summaryMutation.mutate({ week_start: weekStart });
  };

  const topStreak = analyticsLoading ? "..." : Math.max(0, ...(analytics?.streaks || []).map((s) => s.current_streak));
  const burnoutScore = analytics?.burnout?.score;
  const burnoutLevel = analytics?.burnout?.level || "low";
  const patternInsights = (analytics?.patterns || []).slice(0, 2);
  const leadPattern = patternInsights[0];
  const latestSummary = weeklySummaries[0];
  const summaryErrorMessage =
    summaryMutation.error?.response?.data?.detail ||
    summaryMutation.error?.response?.data?.error?.message ||
    summaryMutation.error?.message ||
    "";

  return (
    <div className="animate-floatIn space-y-8 pb-10">
       <header className="flex flex-col gap-2">
        <h1 className="font-display text-4xl">AI Coaching</h1>
        <p className="text-white/50">Your dedicated partner in building sustainable habits and mental resilience.</p>
      </header>

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <CoachChat
            messages={mergedMessages}
            onSend={sendMessage}
            isSending={coachMutation.isPending}
            suggestions={suggestions}
            onClear={clearConversation}
            isClearing={clearHistoryMutation.isPending}
          />
        </div>

        <aside className="space-y-6 lg:col-span-4">
          {/* Performance Snapshot */}
          <div className="glass-card overflow-hidden rounded-3xl p-6 ring-1 ring-white/10 relative">
            <div className="absolute -right-4 -top-4 opacity-5">
               <Zap size={120} />
            </div>
            
            <h3 className="text-lg font-bold flex items-center gap-2">
              <TrendingUp size={18} className="text-brand-400" />
              Week Snapshot
            </h3>
            
            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10 transition-all hover:bg-white/10">
                <div className="flex items-center gap-2 text-warning mb-1">
                  <Flame size={14} />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/30">Top Streak</span>
                </div>
                <p className="text-2xl font-black">
                  {topStreak}
                  <span className="text-xs font-bold text-white/20 uppercase"> days</span>
                </p>
              </div>

              <div className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10 transition-all hover:bg-white/10">
                <div className="flex items-center gap-2 text-brand-400 mb-1">
                  <Zap size={14} />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/30">Burnout</span>
                </div>
                <p className="text-2xl font-black">
                  {burnoutScore ?? "--"}
                  <span className="text-xs font-bold text-white/20 uppercase"> /100</span>
                </p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 mt-1">{burnoutLevel} risk</p>
              </div>
            </div>

            <button
              onClick={generateSummary}
              disabled={summaryMutation.isPending}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-500 py-4 font-bold text-white shadow-lg shadow-brand-500/20 transition-all hover:bg-brand-600 active:scale-[0.98] disabled:opacity-50"
            >
              <Wand2 size={18} />
              {summaryMutation.isPending ? "Generating..." : "Generate AI Summary"}
            </button>
            {summaryMutation.isError ? (
              <p className="mt-3 text-xs text-danger/90">
                {String(summaryErrorMessage || "Could not generate summary right now.")}
              </p>
            ) : null}
          </div>

          <div className="space-y-4">
             <div className="flex items-center justify-between px-2">
               <h3 className="text-[10px] font-bold uppercase tracking-widest text-white/30">Intelligent Insights</h3>
               <Sparkles size={14} className="text-brand-400" />
             </div>
             
             {patternInsights.map((pattern, index) => (
                <InsightCard 
                  key={`${pattern.pattern_type}-${index}`} 
                  title={pattern.pattern_type} 
                  value={pattern.description} 
                  icon={Sparkles}
                />
              ))}
              {!patternInsights.length ? (
                <InsightCard
                  title="Trend Signal"
                  value="Keep logging habits and mood entries to unlock deeper pattern detection."
                  icon={Sparkles}
                />
              ) : null}

              <InsightCard
                title={`${burnoutLevel.charAt(0).toUpperCase() + burnoutLevel.slice(1)} Burnout Risk`}
                value={burnoutGuidance(burnoutLevel)}
                icon={ShieldAlert}
                tone={BURNOUT_TONE[burnoutLevel] || "brand"}
              />

              {summariesLoading ? (
                <div className="glass-card rounded-2xl p-4 ring-1 ring-white/10">
                  <p className="text-sm text-white/50">Loading latest weekly report...</p>
                </div>
              ) : (
                <WeeklyReport summary={latestSummary} />
              )}
              {!summariesLoading && !latestSummary ? (
                <div className="glass-card rounded-2xl p-4 ring-1 ring-white/10">
                  <p className="text-sm text-white/70">No weekly report yet. Generate one from this panel.</p>
                </div>
              ) : null}
          </div>
        </aside>
      </div>
    </div>
  );
}

