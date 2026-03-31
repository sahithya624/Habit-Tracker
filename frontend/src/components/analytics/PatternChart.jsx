import { AlertTriangle, CheckCircle2, Info, RefreshCcw, Sparkles } from "lucide-react";

const iconMap = {
  high: AlertTriangle,
  moderate: Info,
  low: CheckCircle2,
};

const severityColors = {
  high: "text-danger bg-danger/10 ring-danger/20",
  moderate: "text-warning bg-warning/10 ring-warning/20",
  low: "text-success bg-success/10 ring-success/20",
};

const formatDetectedDate = (value) => {
  if (!value) return "Unknown date";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);
  return parsed.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
};

export default function PatternChart({ patterns = [], onRefresh, loading }) {
  return (
    <div className="glass-card flex flex-col justify-between overflow-hidden rounded-3xl p-6 ring-1 ring-white/10">
      <div>
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
             <div className="rounded-xl bg-brand-500/10 p-2 text-brand-500">
               <Sparkles size={20} />
             </div>
             <div>
               <h3 className="text-xl font-bold text-white">Pattern Detection</h3>
               <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold">AI Analytics Engine</p>
             </div>
          </div>
          <button 
            onClick={onRefresh} 
            className={`flex items-center gap-2 rounded-xl bg-white/5 px-4 py-2 text-xs font-bold transition-all hover:bg-white/10 active:scale-95 disabled:opacity-50 ${loading ? 'animate-pulse' : ''}`} 
            disabled={loading}
          >
            <RefreshCcw size={14} className={loading ? "animate-spin" : ""} />
            {loading ? "Analyzing..." : "Refresh"}
          </button>
        </div>

        <div className="space-y-4">
          {patterns.map((pattern, idx) => {
            const Icon = iconMap[pattern.severity] || Info;
            const colorClass = severityColors[pattern.severity] || severityColors.moderate;
            const progressColor = pattern.severity === "high" ? "bg-danger" : pattern.severity === "moderate" ? "bg-warning" : "bg-success";
            
            return (
              <div key={`${pattern.pattern_type}-${idx}`} className="group relative rounded-2xl border border-white/5 bg-white/[0.02] p-4 transition-all hover:bg-white/[0.05]">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl ring-1 ${colorClass}`}>
                      <Icon size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white/90">{pattern.pattern_type}</p>
                      <p className="text-[10px] text-white/30">{formatDetectedDate(pattern.detected_on)}</p>
                    </div>
                  </div>
                </div>
                
                <p className="mt-4 text-xs leading-relaxed text-white/60">
                  {pattern.description}
                </p>

                <div className="mt-4">
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-white/20 mb-1.5">
                    <span>Severity</span>
                    <span className={progressColor.replace('bg-', 'text-')}>{pattern.severity}</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-white/5">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ${progressColor}`} 
                      style={{ width: pattern.severity === "high" ? "90%" : pattern.severity === "moderate" ? "60%" : "30%" }} 
                    />
                  </div>
                </div>
              </div>
            );
          })}
          {!patterns.length && (
            <div className="py-20 text-center opacity-30">
              <Sparkles size={40} className="mx-auto mb-4" />
              <p className="text-sm">No significant patterns detected yet.</p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-brand-500/10 bg-brand-500/5 p-4">
        <p className="text-xs text-brand-300 font-medium italic">
          Tip: Consistent logging increases the accuracy of AI pattern matching.
        </p>
      </div>
    </div>
  );
}

