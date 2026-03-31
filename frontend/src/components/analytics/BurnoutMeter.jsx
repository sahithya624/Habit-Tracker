import { AlertCircle, CheckCircle2, ShieldAlert } from "lucide-react";

const levelColors = {
  low: "stroke-success text-success bg-success/10",
  moderate: "stroke-warning text-warning bg-warning/10",
  high: "stroke-orange-500 text-orange-500 bg-orange-500/10",
  critical: "stroke-danger text-danger bg-danger/10",
};

const levelTextColors = {
  low: "text-success",
  moderate: "text-warning",
  high: "text-orange-500",
  critical: "text-danger",
};

export default function BurnoutMeter({ burnout }) {
  const score = burnout?.score || 0;
  const level = burnout?.level || "low";
  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="glass-card flex flex-col justify-between overflow-hidden rounded-3xl p-6 ring-1 ring-white/10">
      <div>
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
           <ShieldAlert size={20} className="text-brand-400" />
           Burnout Analysis
        </h3>
        <p className="text-sm text-white/40 mt-1">Risk assessment based on recent stress and habit patterns.</p>
        
        <div className="mt-8 flex flex-col items-center justify-center sm:flex-row sm:gap-10">
          <div className="relative h-40 w-40 flex-shrink-0">
            <svg className="h-40 w-40 -rotate-90">
              <circle cx="80" cy="80" r="45" stroke="rgba(255,255,255,0.05)" strokeWidth="12" fill="transparent" />
              <circle
                cx="80"
                cy="80"
                r="45"
                className={`transition-all duration-1000 ease-out ${levelColors[level]}`}
                strokeWidth="12"
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-black text-white">{score}</span>
              <span className={`text-[10px] font-bold uppercase tracking-widest ${levelTextColors[level]}`}>{level}</span>
            </div>
          </div>

          <div className="mt-6 flex flex-col justify-center space-y-4 sm:mt-0">
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">Contributing Factors</p>
              <div className="flex flex-wrap gap-2">
                {(burnout?.contributing_factors || []).map((factor, index) => (
                  <span key={index} className="flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1 text-xs font-medium text-white/70 ring-1 ring-white/10 transition-colors hover:bg-white/10">
                    <AlertCircle size={10} className="text-brand-400" />
                    {factor}
                  </span>
                ))}
                {!(burnout?.contributing_factors?.length) && <span className="text-xs text-white/20 italic">No significant factors detected.</span>}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <div className="rounded-2xl bg-brand-500/5 p-4 ring-1 ring-brand-500/20">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-brand-400">Recovery Protocol</p>
          <ul className="grid gap-2 sm:grid-cols-2">
            {(burnout?.recommendations || []).map((item, index) => (
              <li key={index} className="flex items-start gap-2 text-xs leading-relaxed text-white/70">
                <CheckCircle2 size={14} className="mt-0.5 flex-shrink-0 text-success" />
                <span>{item}</span>
              </li>
            ))}
            {!(burnout?.recommendations?.length) && (
              <li className="text-xs text-white/30 flex items-center gap-2">
                <CheckCircle2 size={14} className="text-white/20" />
                You are maintaining a healthy balance. Keep it up!
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}

