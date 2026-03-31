import { useEffect, useState } from "react";

const categories = ["exercise", "sleep", "reading", "productivity", "custom"];
const frequencies = ["daily", "weekly"];
const colors = ["#6366f1", "#10b981", "#f59e0b", "#f43f5e", "#22c55e", "#38bdf8"];
const icons = ["✅", "🏃", "📚", "💧", "🧘", "💻", "😴", "🎯"];

export default function HabitForm({ open, onClose, onSubmit, initialValues, isSaving }) {
  const [form, setForm] = useState({
    name: "",
    category: "custom",
    target_frequency: "daily",
    target_value: 1,
    unit: "times",
    color: "#6366f1",
    icon: "✅",
  });

  useEffect(() => {
    if (initialValues) {
      setForm({
        name: initialValues.name || "",
        category: initialValues.category || "custom",
        target_frequency: initialValues.target_frequency || "daily",
        target_value: initialValues.target_value || 1,
        unit: initialValues.unit || "times",
        color: initialValues.color || "#6366f1",
        icon: initialValues.icon || "✅",
      });
    }
  }, [initialValues]);

  if (!open) return null;

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const submit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    onSubmit({ ...form, target_value: Number(form.target_value) || 1 });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <form onSubmit={submit} className="glass-card w-full max-w-xl rounded-2xl p-6">
        <h3 className="font-display text-xl">{initialValues ? "Edit Habit" : "Add Habit"}</h3>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <input
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            placeholder="Habit name"
            className="rounded-lg bg-white/5 px-3 py-2 outline-none ring-1 ring-white/10 focus:ring-brand-500"
            required
          />
          <select
            value={form.category}
            onChange={(e) => update("category", e.target.value)}
            className="rounded-lg bg-white/5 px-3 py-2 outline-none ring-1 ring-white/10 focus:ring-brand-500"
          >
            {categories.map((option) => (
              <option key={option} value={option} className="bg-bg-panel">
                {option}
              </option>
            ))}
          </select>

          <select
            value={form.target_frequency}
            onChange={(e) => update("target_frequency", e.target.value)}
            className="rounded-lg bg-white/5 px-3 py-2 outline-none ring-1 ring-white/10 focus:ring-brand-500"
          >
            {frequencies.map((option) => (
              <option key={option} value={option} className="bg-bg-panel">
                {option}
              </option>
            ))}
          </select>
          <input
            type="number"
            min="0"
            step="0.1"
            value={form.target_value}
            onChange={(e) => update("target_value", e.target.value)}
            placeholder="Target value"
            className="rounded-lg bg-white/5 px-3 py-2 outline-none ring-1 ring-white/10 focus:ring-brand-500"
          />

          <input
            value={form.unit}
            onChange={(e) => update("unit", e.target.value)}
            placeholder="Unit (minutes, pages...)"
            className="rounded-lg bg-white/5 px-3 py-2 outline-none ring-1 ring-white/10 focus:ring-brand-500"
          />

          <div>
            <p className="mb-2 text-sm text-white/70">Color</p>
            <div className="flex gap-2">
              {colors.map((color) => (
                <button
                  type="button"
                  key={color}
                  onClick={() => update("color", color)}
                  className="h-8 w-8 rounded-full border-2"
                  style={{ backgroundColor: color, borderColor: form.color === color ? "#fff" : "transparent" }}
                />
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm text-white/70">Icon</p>
            <div className="flex flex-wrap gap-2">
              {icons.map((icon) => (
                <button
                  type="button"
                  key={icon}
                  onClick={() => update("icon", icon)}
                  className={`rounded-lg px-2 py-1 text-lg ${form.icon === icon ? "bg-brand-500" : "bg-white/10"}`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-lg bg-white/10 px-4 py-2 hover:bg-white/20">
            Cancel
          </button>
          <button type="submit" disabled={isSaving} className="rounded-lg bg-brand-500 px-4 py-2 font-medium hover:bg-brand-700">
            {isSaving ? "Saving..." : "Save Habit"}
          </button>
        </div>
      </form>
    </div>
  );
}
