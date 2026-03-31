import { eachDayOfInterval, format, startOfWeek, subWeeks, isSameMonth } from "date-fns";

const getColor = (value = 0, target = 1) => {
  if (!value) return "bg-white/5 ring-1 ring-white/5";
  const ratio = value / target;
  if (ratio < 0.5) return "bg-brand-900 ring-1 ring-brand-800";
  if (ratio < 1) return "bg-brand-700 ring-1 ring-brand-600";
  if (ratio === 1) return "bg-brand-500 ring-1 ring-brand-400";
  return "bg-brand-300 ring-1 ring-brand-200 shadow-[0_0_8px_rgba(168,178,255,0.4)]";
};

export default function HabitCalendar({ logs = [], targetValue = 1 }) {
  const end = new Date();
  const start = startOfWeek(subWeeks(end, 12), { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start, end });

  const valueMap = Object.fromEntries(logs.map((log) => [log.logged_date, log.value]));

  // Group days into weeks for column-based layout
  const weeks = [];
  let currentWeek = [];
  days.forEach((day, i) => {
    currentWeek.push(day);
    if (currentWeek.length === 7 || i === days.length - 1) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  });

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-[3px]">
        {/* Day labels (approximate) */}
        <div className="flex flex-col gap-[3px] pr-2 pt-5 text-[8px] font-bold uppercase text-white/20">
          <span>Mon</span>
          <span className="invisible">Tue</span>
          <span>Wed</span>
          <span className="invisible">Thu</span>
          <span>Fri</span>
          <span className="invisible">Sat</span>
          <span className="invisible">Sun</span>
        </div>

        <div className="flex gap-[3px]">
          {weeks.map((week, weekIdx) => (
            <div key={weekIdx} className="flex flex-col gap-[3px]">
              {/* Month label for the first week of a month */}
              <div className="h-4 text-[9px] font-bold text-white/40">
                {weekIdx === 0 || !isSameMonth(week[0], weeks[weekIdx - 1][0]) ? format(week[0], "MMM") : ""}
              </div>
              {week.map((day) => {
                const key = format(day, "yyyy-MM-dd");
                const value = valueMap[key] || 0;
                return (
                  <div
                    key={key}
                    title={`${format(day, "MMM d, yyyy")}: ${value} ${value === 1 ? 'entry' : 'entries'}`}
                    className={`h-[10px] w-[10px] rounded-[2px] transition-all duration-500 hover:scale-125 hover:z-10 ${getColor(value, targetValue)}`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
      
      <div className="mt-2 flex items-center justify-end gap-2 text-[9px] font-medium text-white/40">
        <span>Less</span>
        <div className="flex gap-1">
          <div className="h-2 w-2 rounded-[1px] bg-white/5" />
          <div className="h-2 w-2 rounded-[1px] bg-brand-900" />
          <div className="h-2 w-2 rounded-[1px] bg-brand-700" />
          <div className="h-2 w-2 rounded-[1px] bg-brand-500" />
          <div className="h-2 w-2 rounded-[1px] bg-brand-300" />
        </div>
        <span>More</span>
      </div>
    </div>
  );
}

