import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import api from "../api/axios";
import { updateProfile } from "../api/auth";
import { useAuthStore } from "../store/authStore";
import { User, Shield, Bell, Trash2, Download, CheckCircle2, RefreshCw, AlertTriangle, Settings as SettingsIcon, LogOut } from "lucide-react";

const timezones = ["UTC", "Asia/Kolkata", "America/New_York", "Europe/London", "Australia/Sydney"];

export default function Settings() {
  const queryClient = useQueryClient();
  const { user, setUser, logout } = useAuthStore();
  const [passwords, setPasswords] = useState({ current: "", next: "", confirm: "" });
  const [notifications, setNotifications] = useState({ weeklySummary: true, reminders: true, burnoutAlerts: true });
  const [showDelete, setShowDelete] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ["auth", "me"],
    queryFn: async () => {
      const { data } = await api.get("/auth/me");
      return data;
    },
  });

  const { data: allHabits = [] } = useQuery({
    queryKey: ["habits", "all-with-archived"],
    queryFn: async () => {
      const { data } = await api.get("/habits/", { params: { include_archived: true } });
      return data;
    },
  });

  const profileMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: (data) => {
      setUser({ ...(user || {}), ...data });
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
      toast.success("Profile updated", { 
        style: { background: "rgba(16, 185, 129, 0.1)", color: "#10b981", border: "1px solid rgba(16, 185, 129, 0.2)", backdropFilter: "blur(10px)" } 
      });
    },
    onError: () => toast.error("Failed to update profile"),
  });

  const reactivateHabit = useMutation({
    mutationFn: async (habit) => {
      const { data } = await api.put(`/habits/${habit.id}`, { is_active: true });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habits"] });
      queryClient.invalidateQueries({ queryKey: ["habits", "all-with-archived"] });
      toast.success("Habit reactivated");
    },
  });

  const saveProfile = (e) => {
    e.preventDefault();
    profileMutation.mutate({ full_name: profile?.full_name || "", timezone: profile?.timezone || "UTC" });
  };

  const handlePasswordChange = (e) => {
    e.preventDefault();
    if (passwords.next.length < 8) {
      toast.error("New password must be at least 8 characters");
      return;
    }
    if (passwords.next !== passwords.confirm) {
      toast.error("Password confirmation does not match");
      return;
    }
    toast.success("Password update simulated");
    setPasswords({ current: "", next: "", confirm: "" });
  };

  const exportData = async () => {
    try {
      const [habitsRes, moodRes, summariesRes, historyRes] = await Promise.all([
        api.get("/habits/", { params: { include_archived: true } }),
        api.get("/mood/"),
        api.get("/ai/weekly-summaries"),
        api.get("/ai/coach/history"),
      ]);
      const blob = new Blob(
        [
          JSON.stringify(
            {
              profile,
              habits: habitsRes.data,
              mood_logs: moodRes.data,
              ai_summaries: summariesRes.data,
              coach_history: historyRes.data,
              exported_at: new Date().toISOString(),
            },
            null,
            2
          ),
        ],
        { type: "application/json" }
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `habitflow-export-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Data archive prepared");
    } catch {
      toast.error("Export failed");
    }
  };

  return (
    <div className="animate-floatIn space-y-8 pb-10">
      <header className="flex flex-col gap-2">
        <h1 className="font-display text-4xl">System Configuration</h1>
        <p className="text-white/50">Manage your profile, habit visibility, and data preferences.</p>
      </header>

      <div className="grid gap-8 lg:grid-cols-12">
        {/* Profile & Security */}
        <div className="space-y-6 lg:col-span-8">
          <section className="glass-card overflow-hidden rounded-3xl ring-1 ring-white/10">
             <div className="border-b border-white/5 bg-white/[0.02] px-6 py-4 flex items-center gap-3">
                <User size={18} className="text-brand-400" />
                <h2 className="text-lg font-bold">Profile Identity</h2>
             </div>
             <form onSubmit={saveProfile} className="p-6">
                <div className="grid gap-6 md:grid-cols-2">
                   <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-white/30 ml-1">Full Name</label>
                      <input
                        value={profile?.full_name || ""}
                        onChange={(e) => queryClient.setQueryData(["auth", "me"], { ...profile, full_name: e.target.value })}
                        className="w-full rounded-2xl bg-white/5 px-4 py-3 outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-brand-500/50"
                        placeholder="Your name"
                      />
                   </div>
                   <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-white/30 ml-1">Email Address</label>
                      <input value={profile?.email || ""} disabled className="w-full rounded-2xl bg-white/5 px-4 py-3 opacity-40 ring-1 ring-white/10 cursor-not-allowed" />
                   </div>
                   <div className="space-y-1.5 md:col-span-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-white/30 ml-1">Timezone</label>
                      <select
                        value={profile?.timezone || "UTC"}
                        onChange={(e) => queryClient.setQueryData(["auth", "me"], { ...profile, timezone: e.target.value })}
                        className="w-full rounded-2xl bg-white/5 px-4 py-3 outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-brand-500/50 appearance-none cursor-pointer"
                      >
                        {timezones.map((tz) => (
                          <option key={tz} value={tz} className="bg-bg-panel">{tz}</option>
                        ))}
                      </select>
                   </div>
                </div>
                <button className="mt-6 flex items-center gap-2 rounded-2xl bg-brand-500 px-6 py-3 font-bold text-white shadow-lg shadow-brand-500/20 transition-all hover:bg-brand-600">
                  <RefreshCw size={16} className={profileMutation.isPending ? "animate-spin" : ""} />
                  {profileMutation.isPending ? "Saving..." : "Update Identity"}
                </button>
             </form>
          </section>

          <section className="glass-card overflow-hidden rounded-3xl ring-1 ring-white/10">
             <div className="border-b border-white/5 bg-white/[0.02] px-6 py-4 flex items-center gap-3">
                <Shield size={18} className="text-brand-400" />
                <h2 className="text-lg font-bold">Security Credentials</h2>
             </div>
             <form onSubmit={handlePasswordChange} className="p-6">
                <div className="grid gap-4 md:grid-cols-1">
                   <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-white/30 ml-1">Current Password</label>
                      <input
                        type="password"
                        value={passwords.current}
                        onChange={(e) => setPasswords((s) => ({ ...s, current: e.target.value }))}
                        className="w-full rounded-2xl bg-white/5 px-4 py-3 outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-brand-500/50"
                        placeholder="Enter current password"
                      />
                   </div>
                   <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-white/30 ml-1">New Password</label>
                        <input
                          type="password"
                          value={passwords.next}
                          onChange={(e) => setPasswords((s) => ({ ...s, next: e.target.value }))}
                          className="w-full rounded-2xl bg-white/5 px-4 py-3 outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-brand-500/50"
                          placeholder="At least 8 chars"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-white/30 ml-1">Confirm New</label>
                        <input
                          type="password"
                          value={passwords.confirm}
                          onChange={(e) => setPasswords((s) => ({ ...s, confirm: e.target.value }))}
                          className="w-full rounded-2xl bg-white/5 px-4 py-3 outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-brand-500/50"
                          placeholder="Repeat password"
                        />
                      </div>
                   </div>
                </div>
                <button className="mt-6 rounded-2xl bg-white/10 px-6 py-3 font-bold text-white transition-all hover:bg-white/20">
                  Update Password
                </button>
             </form>
          </section>
        </div>

        {/* Preferences & Sidebar */}
        <div className="space-y-6 lg:col-span-4">
          <section className="glass-card overflow-hidden rounded-3xl ring-1 ring-white/10">
             <div className="border-b border-white/5 bg-white/[0.02] px-6 py-4 flex items-center gap-3">
                <SettingsIcon size={18} className="text-brand-400" />
                <h2 className="text-lg font-bold">Habit Visibility</h2>
             </div>
             <div className="p-4 space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar">
                {allHabits.map((habit) => (
                  <div key={habit.id} className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/[0.02] px-4 py-3 transition-colors hover:bg-white/[0.05]">
                    <div className="flex items-center gap-3">
                       <span className="text-lg">{habit.icon}</span>
                       <div>
                          <p className="text-xs font-bold text-white/80">{habit.name}</p>
                          <p className={`text-[10px] font-bold uppercase ${habit.is_active ? 'text-success/60' : 'text-white/20'}`}>
                            {habit.is_active ? "Active" : "Archived"}
                          </p>
                       </div>
                    </div>
                    {!habit.is_active && (
                       <button onClick={() => reactivateHabit.mutate(habit)} className="p-1.5 rounded-lg bg-success/20 text-success transition-all hover:bg-success hover:text-white">
                         <RefreshCw size={14} />
                       </button>
                    )}
                  </div>
                ))}
                {allHabits.length === 0 && <p className="py-10 text-center text-xs text-white/20 italic">No habit records found.</p>}
             </div>
          </section>

          <section className="glass-card overflow-hidden rounded-3xl ring-1 ring-white/10">
             <div className="border-b border-white/5 bg-white/[0.02] px-6 py-4 flex items-center gap-3">
                <Bell size={18} className="text-brand-400" />
                <h2 className="text-lg font-bold">Preferences</h2>
             </div>
             <div className="p-6 space-y-4">
                {Object.entries(notifications).map(([key, value]) => (
                  <label key={key} className="flex cursor-pointer items-center justify-between">
                    <span className="text-sm font-medium text-white/70 capitalize">{key.replace(/([A-Z])/g, " $1")}</span>
                    <div className="relative inline-flex items-center">
                      <input
                        type="checkbox"
                        checked={value}
                        onChange={(e) => setNotifications((prev) => ({ ...prev, [key]: e.target.checked }))}
                        className="peer h-6 w-11 cursor-pointer appearance-none rounded-full bg-white/10 transition-colors checked:bg-brand-500"
                      />
                      <span className="pointer-events-none absolute left-1 h-4 w-4 rounded-full bg-white transition-all peer-checked:left-6" />
                    </div>
                  </label>
                ))}
             </div>
          </section>

          <section className="rounded-3xl border border-danger/10 bg-danger/5 p-6 space-y-4">
             <h2 className="text-lg font-bold text-danger flex items-center gap-2">
                <AlertTriangle size={18} />
                Danger Zone
             </h2>
             <div className="space-y-3">
               <button onClick={exportData} className="flex w-full items-center justify-between rounded-2xl bg-white/5 px-4 py-3 text-xs font-bold text-white/60 transition-all hover:bg-white/10 hover:text-white">
                  <span>Export JSON Data</span>
                  <Download size={14} />
               </button>
               <button onClick={() => setShowDelete(true)} className="flex w-full items-center justify-between rounded-2xl bg-danger/10 px-4 py-3 text-xs font-bold text-danger transition-all hover:bg-danger hover:text-white">
                  <span>Terminate Account</span>
                  <Trash2 size={14} />
               </button>
             </div>
          </section>
        </div>
      </div>

      {showDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="glass-card max-w-md w-full rounded-3xl p-8 ring-1 ring-white/10">
            <div className="flex justify-center mb-6 text-danger">
               <div className="p-4 rounded-full bg-danger/10">
                  <AlertTriangle size={48} />
               </div>
            </div>
            <h3 className="text-2xl font-bold text-center text-white">Critical Confirmation</h3>
            <p className="mt-3 text-center text-sm text-white/40 leading-relaxed">
              This action will permanently purge your identity and all logged habit progress. This is irreversible.
            </p>
            <div className="mt-8 flex flex-col gap-3">
               <button
                onClick={() => {
                  setShowDelete(false);
                  logout();
                }}
                className="w-full rounded-2xl bg-danger py-4 font-bold text-white shadow-lg shadow-danger/20 transition-all hover:bg-red-600 active:scale-95"
              >
                Confirm Deletion
              </button>
              <button 
                onClick={() => setShowDelete(false)} 
                className="w-full rounded-2xl bg-white/5 py-4 font-bold text-white transition-all hover:bg-white/10"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

