import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { loginUser } from "../api/auth";
import { useAuthStore } from "../store/authStore";

export default function Login() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      toast.error("Email and password are required");
      return;
    }

    setLoading(true);
    try {
      const data = await loginUser(form);
      login(
        {
          id: data.user_id,
          email: data.email,
          full_name: data.full_name || "User",
        },
        data.access_token
      );
      toast.success("Welcome back", { style: { background: "#0b2e22", color: "#8ff0c6" } });
      navigate("/dashboard");
    } catch (error) {
      toast.error(error.response?.data?.error?.message || "Login failed", {
        style: { background: "#3a0f1a", color: "#ffd2db" },
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="gradient-bg flex min-h-screen items-center justify-center p-4">
      <form onSubmit={submit} className="glass-card w-full max-w-md rounded-2xl p-8">
        <h1 className="font-display text-3xl">Sign In</h1>
        <p className="mt-1 text-sm text-white/65">Continue your HabitFlow journey</p>

        <div className="mt-5 space-y-3">
          <input
            type="email"
            required
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
            className="w-full rounded-lg bg-white/5 px-4 py-3 outline-none ring-1 ring-white/10 focus:ring-brand-500"
          />
          <input
            type="password"
            required
            minLength={8}
            placeholder="Password"
            value={form.password}
            onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
            className="w-full rounded-lg bg-white/5 px-4 py-3 outline-none ring-1 ring-white/10 focus:ring-brand-500"
          />
        </div>

        <button
          disabled={loading}
          className="mt-5 w-full rounded-lg bg-brand-500 py-3 font-semibold transition duration-300 hover:bg-brand-700 disabled:opacity-60"
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>

        <p className="mt-4 text-center text-sm text-white/65">
          New here? {" "}
          <Link to="/register" className="text-brand-300 hover:text-brand-100">
            Create account
          </Link>
        </p>
      </form>
    </div>
  );
}
