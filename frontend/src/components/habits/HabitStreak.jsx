export default function HabitStreak({ current, longest }) {
  return (
    <div className="mt-2 flex items-center gap-2 text-xs text-white/70">
      <span className="rounded-full bg-brand-500/20 px-2 py-1">Current {current}d</span>
      <span className="rounded-full bg-success/20 px-2 py-1">Best {longest}d</span>
    </div>
  );
}
