export default function MoodSlider({ label, value, onChange, icon }) {
  const getStatusColor = (v) => {
    if (v <= 3) return "text-danger";
    if (v <= 6) return "text-warning";
    return "text-success";
  };

  const tag = value <= 3 ? "Low" : value <= 6 ? "Moderate" : "Excellent";

  return (
    <div className="space-y-3 group">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon && <span className="text-white/40 group-hover:text-brand-400 transition-colors">{icon}</span>}
          <span className="text-sm font-semibold text-white/80">{label}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold uppercase tracking-wider ${getStatusColor(value)}`}>
            {tag}
          </span>
          <span className="rounded-md bg-white/5 px-2 py-0.5 text-sm font-bold text-white ring-1 ring-white/10">
            {value}
          </span>
        </div>
      </div>
      
      <div className="relative">
        <input
          type="range"
          min="1"
          max="10"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-white/10 accent-brand-500 hover:bg-white/15 transition-all"
        />
        <div className="flex justify-between px-1 mt-1">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className={`h-1 w-0.5 rounded-full ${i + 1 <= value ? 'bg-brand-500/50' : 'bg-white/10'}`} />
          ))}
        </div>
      </div>
    </div>
  );
}

