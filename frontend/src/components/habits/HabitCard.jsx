import { CheckCircle2, Circle, Flame, Pencil, Trash2, TrendingUp } from "lucide-react";

export default function HabitCard({ habit, isDoneToday, onQuickLog, onEdit, onArchive, isLogging }) {
  return (
    <div className="glass-card flex flex-col justify-between overflow-hidden rounded-2xl p-5 transition-all duration-300 hover:bg-white/[0.08] hover:shadow-xl">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-2xl ring-1 ring-white/10">
            {habit.icon}
          </div>
          <div>
            <h4 className="text-lg font-bold text-white">{habit.name}</h4>
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">{habit.category}</span>
          </div>
        </div>
        
        <div className="flex gap-1.5 opacity-0 transition-opacity duration-300 group-hover:opacity-100 lg:opacity-60 lg:hover:opacity-100">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit?.(habit);
            }}
            className="rounded-lg p-2 text-white/50 hover:bg-white/10 hover:text-white"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onArchive?.(habit.id);
            }}
            className="rounded-lg p-2 text-danger/50 hover:bg-danger/10 hover:text-danger"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-xs font-medium text-white/60">
            <TrendingUp size={12} className="text-brand-400" />
            <span>Success Rate</span>
          </div>
          <p className="text-sm font-bold text-brand-300">
            {Math.round(habit.completion_rate_7d * 100)}% <span className="text-[10px] font-normal text-white/30">last 7d</span>
          </p>
        </div>

        <button
          disabled={isLogging || isDoneToday}
          onClick={(e) => {
            e.stopPropagation();
            onQuickLog?.(habit);
          }}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition-all duration-300 ${
            isDoneToday
              ? "bg-success/10 text-success ring-1 ring-success/20 cursor-default"
              : "bg-brand-500 text-white shadow-lg shadow-brand-500/20 hover:bg-brand-600 active:scale-95 disabled:opacity-50"
          }`}
        >
          {isDoneToday ? (
            <>
              <CheckCircle2 size={16} />
              <span>Done</span>
            </>
          ) : (
            <>
              <Circle size={16} />
              <span>{isLogging ? "Saving..." : "Log Entry"}</span>
            </>
          )}
        </button>
      </div>

      <div className="mt-4 flex items-center gap-2 border-t border-white/5 pt-3">
        <div className="flex items-center gap-1 rounded-full bg-warning/10 px-2 py-0.5 text-[10px] font-bold text-warning ring-1 ring-warning/20">
          <Flame size={10} fill="currentColor" />
          <span>Cur: {habit.current_streak}d</span>
        </div>
        <div className="flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-bold text-success ring-1 ring-success/20">
          <TrendingUp size={10} />
          <span>Best: {habit.longest_streak}d</span>
        </div>
      </div>
    </div>
  );
}

