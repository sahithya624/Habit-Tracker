import { useState } from "react";
import EmptyState from "../components/ui/EmptyState";
import { useGenerateSummary, useWeeklySummaries } from "../hooks/useAI";
import { getCurrentWeekRange } from "../utils/dateHelpers";
import { Calendar, ChevronDown, ChevronUp, CheckCircle2, Wand2, Archive, Hash, AlertCircle } from "lucide-react";

export default function WeeklySummary() {
  const { data: summaries = [], isLoading } = useWeeklySummaries();
  const generateSummary = useGenerateSummary();
  const [expanded, setExpanded] = useState(null);
  const [checked, setChecked] = useState({});

  const onGenerate = () => {
    const { weekStart } = getCurrentWeekRange();
    generateSummary.mutate({ week_start: weekStart });
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 w-48 rounded-lg bg-white/5" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-24 rounded-3xl bg-white/5" />
        ))}
      </div>
    );
  }

  if (!summaries.length) {
    return (
      <div className="space-y-8 animate-floatIn">
        <header className="flex flex-col gap-2">
           <h1 className="font-display text-4xl">Weekly Summaries</h1>
           <p className="text-white/50">Your personal AI-curated performance reports and architectural insights.</p>
        </header>

        <EmptyState
          title="No Reports Generated"
          icon={Archive}
          description="Aria generates deep behavior analysis and personalized growth protocols every week."
          action={
            <button 
              onClick={onGenerate} 
              disabled={generateSummary.isPending}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-500 py-4 font-bold text-white shadow-lg transition-all hover:bg-brand-600 disabled:opacity-50"
            >
              <Wand2 size={18} />
              {generateSummary.isPending ? "Generating..." : "Generate AI Summary"}
            </button>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-floatIn pb-10">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
           <h1 className="font-display text-4xl">Weekly Archives</h1>
           <p className="text-white/50">Historical record of your habits and AI behavior analysis.</p>
        </div>
        <button 
          onClick={onGenerate} 
          disabled={generateSummary.isPending}
          className="flex items-center gap-2 rounded-2xl bg-brand-500 px-6 py-3 font-bold text-white shadow-lg shadow-brand-500/20 transition-all hover:bg-brand-600 active:scale-95 disabled:opacity-50"
        >
          <Wand2 size={18} />
          {generateSummary.isPending ? "Analyzing..." : "Generate New"}
        </button>
      </header>

      <div className="space-y-4">
        {summaries.map((summary) => {
          const isOpen = expanded === summary.id;
          const riskColor = 
            summary.burnout_risk_level === "critical" ? "text-danger bg-danger/10 ring-danger/20" :
            summary.burnout_risk_level === "high" ? "text-warning bg-warning/10 ring-warning/20" :
            "text-success bg-success/10 ring-success/20";
            
          return (
            <article key={summary.id} className={`glass-card overflow-hidden rounded-3xl ring-1 transition-all ${isOpen ? 'ring-brand-500/30 ring-2' : 'ring-white/10'}`}>
              <button
                onClick={() => setExpanded(isOpen ? null : summary.id)}
                className={`flex w-full items-center justify-between px-6 py-5 text-left transition-colors ${isOpen ? 'bg-white/[0.04]' : 'hover:bg-white/[0.02]'}`}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-2.5 rounded-xl bg-white/5 text-white/30 hidden sm:block`}>
                    <Calendar size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white/90">
                      Report: {summary.week_start} — {summary.week_end}
                    </h3>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">Executive Summary</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest ring-1 ${riskColor}`}>
                    {summary.burnout_risk_level} Risk
                  </span>
                  {isOpen ? <ChevronUp size={20} className="text-white/20" /> : <ChevronDown size={20} className="text-white/20" />}
                </div>
              </button>

              {isOpen && (
                <div className="border-t border-white/5 p-6 animate-floatIn">
                   <div className="max-w-4xl space-y-8">
                     {/* The Summary */}
                     <section>
                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-brand-400 mb-3 flex items-center gap-2">
                           <Archive size={12} />
                           Architecture Insights
                        </h4>
                        <p className="text-sm leading-relaxed text-white/70 whitespace-pre-line bg-white/[0.02] p-6 rounded-2xl ring-1 ring-white/5 border-l-2 border-brand-500/30">
                          {summary.summary_text}
                        </p>
                     </section>

                     {/* The Protocol */}
                     <section>
                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-success mb-3 flex items-center gap-2">
                           <CheckCircle2 size={12} />
                           Personalized Protocol
                        </h4>
                        <div className="grid gap-3 sm:grid-cols-2">
                          {summary.recommendations.map((item, index) => {
                            const key = `${summary.id}-${index}`;
                            const isChecked = Boolean(checked[key]);
                            return (
                              <label 
                                key={key} 
                                className={`flex cursor-pointer select-none items-center gap-3 rounded-2xl border p-4 transition-all ${
                                  isChecked 
                                    ? 'bg-success/5 border-success/30 text-white/80' 
                                    : 'bg-white/5 border-white/5 text-white/50 hover:bg-white/10'
                                }`}
                              >
                                <div className="relative flex items-center justify-center">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={(e) => setChecked((prev) => ({ ...prev, [key]: e.target.checked }))}
                                    className="peer h-5 w-5 opacity-0 cursor-pointer"
                                  />
                                  <div className={`absolute h-5 w-5 rounded-lg border-2 flex items-center justify-center transition-all ${
                                    isChecked ? 'bg-success border-success' : 'border-white/20'
                                  }`}>
                                    {isChecked && <CheckCircle2 size={12} className="text-bg-panel" />}
                                  </div>
                                </div>
                                <span className="text-xs font-medium">{item}</span>
                              </label>
                            );
                          })}
                        </div>
                     </section>

                     {/* The Patterns Tags */}
                     <section>
                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-white/20 mb-3 flex items-center gap-2">
                           <Hash size={12} />
                           Detected Patterns
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {(summary.patterns_detected || []).map((tag) => (
                            <span key={tag} className="flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1.5 text-[10px] font-bold text-white/40 ring-1 ring-white/10">
                              <AlertCircle size={10} />
                              {tag}
                            </span>
                          ))}
                          {!(summary.patterns_detected?.length) && <span className="text-xs text-white/20 italic">No specific patterns flagged.</span>}
                        </div>
                     </section>
                   </div>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}

