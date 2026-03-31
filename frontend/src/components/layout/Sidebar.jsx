import {
  BarChart3,
  Bot,
  CheckSquare,
  FileText,
  Heart,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  Sparkles,
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";
import clsx from "clsx";
import { useAuthStore } from "../../store/authStore";

const links = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/habits", label: "Habits", icon: CheckSquare },
  { to: "/mood", label: "Mood", icon: Heart },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/coach", label: "AI Coach", icon: Bot },
  { to: "/summaries", label: "Weekly Summary", icon: FileText },
  { to: "/settings", label: "Settings", icon: Settings },
];

function NavItems({ mobile = false, onClick }) {
  return links.map((link) => {
    const Icon = link.icon;
    return (
      <NavLink
        key={link.to}
        to={link.to}
        onClick={onClick}
        className={({ isActive }) =>
          clsx(
            "flex items-center gap-3 rounded-xl px-3 py-2 transition duration-300",
            mobile ? "justify-center px-2" : "",
            isActive
              ? "border-l-2 border-brand-500 bg-brand-500/20 text-brand-300"
              : "text-white/70 hover:bg-white/5 hover:text-white"
          )
        }
      >
        <Icon size={18} />
        {!mobile && <span>{link.label}</span>}
      </NavLink>
    );
  });
}

export default function Sidebar() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const onLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <>
      <button
        className="fixed left-4 top-4 z-50 rounded-lg bg-bg-panel p-2 text-white md:hidden"
        onClick={() => setOpen((s) => !s)}
      >
        <Menu size={20} />
      </button>

      <aside
        className={clsx(
          "fixed left-0 top-0 z-40 h-full w-60 border-r border-white/10 bg-bg-panel/90 p-4 backdrop-blur-xl transition-transform duration-300",
          open ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="mb-8 flex items-center gap-2 px-2">
          <Sparkles className="text-brand-500" size={22} />
          <h1 className="font-display text-xl">HabitFlow AI</h1>
        </div>

        <nav className="space-y-1">
          <NavItems onClick={() => setOpen(false)} />
        </nav>

        <div className="absolute bottom-4 left-4 right-4 rounded-xl border border-white/10 bg-white/5 p-3">
          <p className="text-sm font-medium">{user?.full_name || "User"}</p>
          <p className="truncate text-xs text-white/60">{user?.email}</p>
          <button
            onClick={onLogout}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-danger/20 px-3 py-2 text-sm text-danger hover:bg-danger/30"
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>

      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-bg-panel/95 p-2 backdrop-blur md:hidden">
        <div className="grid grid-cols-7 gap-1">
          <NavItems mobile />
        </div>
      </div>
    </>
  );
}
