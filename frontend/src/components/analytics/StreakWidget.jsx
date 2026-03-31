import { Flame, TrendingUp, Calendar, Hash } from "lucide-react";

export default function StreakWidget({ streaks = [] }) {
  return (
    <div className="glass-card overflow-hidden rounded-3xl p-6 ring-1 ring-white/10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-white">Streaks & Performance</h3>
          <p className="text-sm text-white/40">Real-time consistency tracking for all active habits.</p>
        </div>
      </div>

      <div className="w-full overflow-x-auto overflow-y-hidden custom-scrollbar">
        <table className="w-full min-w-[600px] text-left">
          <thead>
            <tr className="border-b border-white/5 text-[10px] uppercase tracking-widest text-white/30">
              <th className="pb-4 font-bold">Habit</th>
              <th className="pb-4 font-bold"><div className="flex items-center gap-1"><Flame size={12} /> Current</div></th>
              <th className="pb-4 font-bold"><div className="flex items-center gap-1"><TrendingUp size={12} /> Best</div></th>
              <th className="pb-4 font-bold"><div className="flex items-center gap-1"><Calendar size={12} /> 7d %</div></th>
              <th className="pb-4 font-bold"><div className="flex items-center gap-1"><Hash size={12} /> 30d %</div></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {streaks.map((row) => {
              const rate30 = row.completion_30d * 100;
              const rate7 = row.completion_7d * 100;
              const color30 = rate30 > 80 ? "text-success" : rate30 >= 50 ? "text-warning" : "text-danger";
              const color7 = rate7 > 80 ? "text-success" : rate7 >= 50 ? "text-warning" : "text-danger";
              
              return (
                <tr key={row.habit_id} className="group transition-colors hover:bg-white/[0.02]">
                  <td className="py-4">
                    <span className="text-sm font-bold text-white/90 group-hover:text-white transition-colors">
                      {row.habit_name}
                    </span>
                  </td>
                  <td className="py-4">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-bold text-warning">{row.current_streak}</span>
                      <span className="text-[10px] text-white/20 uppercase">days</span>
                    </div>
                  </td>
                  <td className="py-4">
                     <div className="flex items-center gap-1.5">
                      <span className="text-sm font-bold text-success">{row.longest_streak}</span>
                      <span className="text-[10px] text-white/20 uppercase">days</span>
                    </div>
                  </td>
                  <td className="py-4">
                    <span className={`text-sm font-bold ${color7}`}>
                      {Math.round(rate7)}%
                    </span>
                  </td>
                  <td className="py-4">
                    <span className={`text-sm font-bold ${color30}`}>
                      {Math.round(rate30)}%
                    </span>
                  </td>
                </tr>
              );
            })}
            {!streaks.length && (
               <tr>
                <td colSpan="5" className="py-10 text-center text-sm text-white/20 italic">
                  No habit data available to analyze.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

