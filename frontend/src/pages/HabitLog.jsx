import { useMemo, useState } from "react";
import HabitCalendar from "../components/habits/HabitCalendar";
import HabitCard from "../components/habits/HabitCard";
import HabitForm from "../components/habits/HabitForm";
import EmptyState from "../components/ui/EmptyState";
import { useAllHabitLogs, useCreateHabit, useDeleteHabit, useHabitLogs, useHabits, useLogHabit, useUpdateHabit } from "../hooks/useHabits";
import { getLastNDaysISO, getTodayISO } from "../utils/dateHelpers";
import { Plus, LayoutGrid, Calendar as CalendarIcon, Zap, Target } from "lucide-react";

export default function HabitLog() {
  const { data: habits = [], isLoading } = useHabits();
  const createHabit = useCreateHabit();
  const updateHabit = useUpdateHabit();
  const deleteHabit = useDeleteHabit();
  const logHabit = useLogHabit();

  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [selectedHabitId, setSelectedHabitId] = useState(null);

  const selectedHabit = habits.find((h) => h.id === selectedHabitId) || habits[0];
  const { startDate, endDate } = getLastNDaysISO(84);
  const { data: selectedLogs = [] } = useHabitLogs(selectedHabit?.id, startDate, endDate);

  const today = getTodayISO();
  const { data: todayLogs = [] } = useAllHabitLogs(today, today);
  const doneToday = useMemo(() => new Set(todayLogs.map((log) => log.habit_id)), [todayLogs]);

  const onFormSubmit = (payload) => {
    if (editing) {
      updateHabit.mutate({ id: editing.id, payload }, { onSuccess: () => { setEditing(null); setOpenForm(false); } });
    } else {
      createHabit.mutate(payload, { onSuccess: () => setOpenForm(false) });
    }
  };

  const stats = {
    rate7: selectedHabit ? Math.round(selectedHabit.completion_rate_7d * 100) : 0,
    rate30: selectedHabit ? Math.round(selectedHabit.completion_rate_30d * 100) : 0,
    streak: selectedHabit?.longest_streak || 0,
    avgValue:
      selectedLogs.length > 0 ? (selectedLogs.reduce((sum, item) => sum + Number(item.value || 0), 0) / selectedLogs.length).toFixed(1) : 0,
  };

  return (
    <div className="space-y-8 animate-floatIn">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-4xl">Your Habits</h1>
          <p className="mt-1 text-white/50">Track, analyze, and master your daily routines.</p>
        </div>
        <button
          onClick={() => {
            setEditing(null);
            setOpenForm(true);
          }}
          className="flex items-center justify-center gap-2 rounded-xl bg-brand-500 px-5 py-3 font-semibold text-white shadow-lg transition duration-300 hover:bg-brand-600 hover:shadow-brand-500/20 active:scale-95 sm:w-auto"
        >
          <Plus size={20} />
          <span>Add Habit</span>
        </button>
      </header>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left: Habit List */}
        <section className="space-y-4 lg:col-span-5 xl:col-span-4">
          <div className="flex items-center gap-2 text-sm font-medium text-white/70">
            <LayoutGrid size={16} />
            <span>Habit List</span>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="skeleton h-32 rounded-2xl w-full" />
              ))}
            </div>
          ) : habits.length === 0 ? (
            <div className="glass-card flex flex-col items-center justify-center rounded-2xl p-12 text-center">
              <div className="rounded-full bg-brand-500/10 p-4 text-brand-500">
                <Target size={32} />
              </div>
              <h3 className="mt-4 text-lg font-semibold">Ready to start?</h3>
              <p className="mt-2 text-sm text-white/50">Create your first habit to begin your journey.</p>
              <button 
                onClick={() => setOpenForm(true)}
                className="mt-6 rounded-lg bg-white/10 px-4 py-2 text-sm font-medium hover:bg-white/20"
              >
                Get Started
              </button>
            </div>
          ) : (
            <div className="grid gap-4">
              {habits.map((habit) => (
                <div 
                  key={habit.id} 
                  onClick={() => setSelectedHabitId(habit.id)} 
                  className={`w-full cursor-pointer rounded-2xl transition-all duration-300 ${
                    selectedHabitId === habit.id ? 'ring-2 ring-brand-500 shadow-xl' : 'hover:translate-x-1'
                  }`}
                >
                  <HabitCard
                    habit={habit}
                    isDoneToday={doneToday.has(habit.id)}
                    isLogging={logHabit.isPending}
                    onQuickLog={() => logHabit.mutate({ habit_id: habit.id, logged_date: today, value: 1, notes: "Quick log" })}
                    onEdit={(target) => {
                      setEditing(target);
                      setOpenForm(true);
                    }}
                    onArchive={(id) => deleteHabit.mutate(id)}
                  />
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Right: Insights & Details */}
        <section className="space-y-6 lg:col-span-7 xl:col-span-8">
          <div className="flex items-center gap-2 text-sm font-medium text-white/70">
            <CalendarIcon size={16} />
            <span>Habit Insights</span>
          </div>

          {selectedHabit ? (
            <div className="space-y-6">
              {/* Heatmap Card */}
              <div className="glass-card rounded-3xl p-6">
                <div className="mb-6 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{selectedHabit.icon}</span>
                    <div>
                      <h3 className="text-xl font-bold">{selectedHabit.name}</h3>
                      <p className="text-sm text-white/50 uppercase tracking-wider">{selectedHabit.category}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 rounded-full bg-warning/10 px-3 py-1 text-warning">
                    <Zap size={14} fill="currentColor" />
                    <span className="text-sm font-bold">{selectedHabit.current_streak}d streak</span>
                  </div>
                </div>

                <div className="overflow-x-auto pb-4">
                  <HabitCalendar logs={selectedLogs} targetValue={selectedHabit.target_value || 1} />
                </div>

                <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
                  <StatCard label="7d Completion" value={`${stats.rate7}%`} trend="Overall consistency" />
                  <StatCard label="30d Completion" value={`${stats.rate30}%`} trend="Long-term tracking" />
                  <StatCard label="Best Streak" value={`${stats.streak}d`} trend="Your all-time high" />
                  <StatCard label="Avg Value" value={stats.avgValue} trend={`per ${selectedHabit.unit || 'entry'}`} />
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-card flex h-full min-h-[400px] flex-col items-center justify-center rounded-3xl p-12 text-center opacity-60">
              <CalendarIcon size={48} className="text-white/20" />
              <h3 className="mt-4 text-lg font-semibold">Select a habit</h3>
              <p className="mt-2 text-sm text-white/50 max-w-xs">
                Pick a habit from the list to see your performance and consistency over the last 12 weeks.
              </p>
            </div>
          )}
        </section>
      </div>

      <HabitForm
        open={openForm}
        onClose={() => {
          setOpenForm(false);
          setEditing(null);
        }}
        onSubmit={onFormSubmit}
        initialValues={editing}
        isSaving={createHabit.isPending || updateHabit.isPending}
      />
    </div>
  );
}

function StatCard({ label, value, trend }) {
  return (
    <div className="glass-card rounded-2xl bg-white/5 p-4 ring-1 ring-white/10 transition-all hover:bg-white/10">
      <p className="text-xs font-medium text-white/40 uppercase tracking-wider">{label}</p>
      <p className="mt-2 text-2xl font-bold">{value}</p>
      <p className="mt-1 text-[10px] text-white/30">{trend}</p>
    </div>
  );
}

