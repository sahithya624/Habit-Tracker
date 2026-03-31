import { Database } from "lucide-react";

export default function EmptyState({ title, description, action, icon: Icon }) {
  const DisplayIcon = Icon || Database;
  
  return (
    <div className="glass-card flex min-h-[400px] flex-col items-center justify-center rounded-3xl p-12 text-center ring-1 ring-white/10 animate-floatIn">
      <div className="mb-6 rounded-2xl bg-brand-500/10 p-4 text-brand-400 ring-1 ring-brand-500/20">
        <DisplayIcon size={32} />
      </div>
      <h3 className="text-2xl font-bold text-white">{title}</h3>
      <p className="mt-3 max-w-[300px] text-sm leading-relaxed text-white/40">{description}</p>
      {action ? <div className="mt-8 w-full max-w-[240px]">{action}</div> : null}
    </div>
  );
}

