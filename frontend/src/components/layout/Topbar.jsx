import { Bell } from "lucide-react";
import { format } from "date-fns";
import { useHabits } from "../../hooks/useHabits";

export default function Topbar() {
  const { data: habits = [] } = useHabits();
  const completed = habits.filter((h) => h.current_streak > 0).length;
  const total = habits.length || 1;
  const progress = Math.round((completed / total) * 100);

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-bg-deep/90 px-6 py-4 backdrop-blur">
      <div className="flex items-center justify-end gap-4">
        <p className="hidden text-sm text-white/60 md:block">{format(new Date(), "EEEE, MMM d, yyyy")}</p>
        <button className="rounded-full bg-white/5 p-2 text-white/70 hover:bg-white/10 hover:text-white">
          <Bell size={18} />
        </button>
      </div>
      <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-white/10">
        <div className="h-full bg-brand-500 transition-all duration-300" style={{ width: `${progress}%` }} />
      </div>
    </header>
  );
}
