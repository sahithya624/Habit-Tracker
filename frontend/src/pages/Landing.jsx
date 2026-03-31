import { Link } from "react-router-dom";
import { Bot, BrainCircuit, Flame, LineChart, ShieldAlert, Target } from "lucide-react";

const features = [
  { title: "Daily Tracking", icon: Target },
  { title: "Pattern Detection", icon: BrainCircuit },
  { title: "AI Coach", icon: Bot },
  { title: "Burnout Prevention", icon: ShieldAlert },
  { title: "Weekly Reports", icon: LineChart },
  { title: "Streak System", icon: Flame },
];

export default function Landing() {
  return (
    <div className="gradient-bg min-h-screen overflow-hidden">
      <div className="mx-auto max-w-7xl px-6 py-14 md:py-24">
        <section className="animate-floatIn text-center">
          <h1 className="mx-auto max-w-4xl font-display text-4xl leading-tight md:text-6xl">
            Transform Your Habits with AI-Powered Insights
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-white/75 md:text-lg">
            Track, analyze, and optimize your daily routines with intelligent behavioral coaching.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/register" className="rounded-xl bg-brand-500 px-6 py-3 font-medium hover:bg-brand-700">
              Start Free
            </Link>
            <Link to="/login" className="rounded-xl border border-white/20 bg-white/5 px-6 py-3 hover:bg-white/10">
              Sign In
            </Link>
          </div>
        </section>

        <section className="mt-16 grid gap-4 md:grid-cols-3">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="glass-card animate-floatIn rounded-2xl p-5"
                style={{ animationDelay: `${index * 80}ms` }}
              >
                <Icon className="text-brand-300" size={20} />
                <h3 className="mt-3 text-lg font-semibold">{feature.title}</h3>
                <p className="mt-1 text-sm text-white/65">Built to give you actionable decisions, not just charts.</p>
              </div>
            );
          })}
        </section>

        <section className="mt-14 grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <article key={item} className="glass-card rounded-2xl p-5">
              <p className="text-sm text-white/75">
                "HabitFlow AI helped me finally see how sleep and stress were impacting my consistency."
              </p>
              <p className="mt-4 text-sm font-semibold">User {item}</p>
            </article>
          ))}
        </section>
      </div>

      <footer className="border-t border-white/10 py-6 text-center text-sm text-white/60">HabitFlow AI</footer>
    </div>
  );
}
