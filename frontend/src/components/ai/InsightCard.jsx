import { Sparkles } from "lucide-react";

export default function InsightCard({ title, value, icon, tone = "brand" }) {
  const toneMap = {
    success: "text-success bg-success/10 ring-success/20",
    warning: "text-warning bg-warning/10 ring-warning/20",
    danger: "text-danger bg-danger/10 ring-danger/20",
    brand: "text-brand-400 bg-brand-500/10 ring-brand-500/20",
  };

  const Icon = icon || Sparkles;

  return (
    <div className={`glass-card flex items-start gap-4 rounded-2xl p-4 ring-1 ring-white/10 transition-all hover:bg-white/5`}>
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ${toneMap[tone]}`}>
        <Icon size={18} />
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">{title}</p>
        <p className="mt-1 text-sm font-medium leading-relaxed text-white/80">{value}</p>
      </div>
    </div>
  );
}

