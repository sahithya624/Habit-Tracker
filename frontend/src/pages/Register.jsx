import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { registerUser } from "../api/auth";
import { useAuthStore } from "../store/authStore";

export default function Register() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ full_name: "", email: "", password: "", confirm_password: "" });

  const submit = async (e) => {
    e.preventDefault();
    if (form.password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    if (form.password !== form.confirm_password) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const data = await registerUser({ full_name: form.full_name, email: form.email, password: form.password });
      login(
        {
          id: data.user_id,
          email: data.email,
          full_name: data.full_name || form.full_name,
        },
        data.access_token
      );
      toast.success("Account created", { style: { background: "#0b2e22", color: "#8ff0c6" } });
      navigate("/dashboard");
    } catch (error) {
      toast.error(error.response?.data?.error?.message || "Registration failed", {
        style: { background: "#3a0f1a", color: "#ffd2db" },
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="gradient-bg flex min-h-screen items-center justify-center p-4">
      <form onSubmit={submit} className="glass-card w-full max-w-md rounded-2xl p-8">
        <h1 className="font-display text-3xl">Create Account</h1>
        <p className="mt-1 text-sm text-white/65">Start improving your habits today</p>

        <div className="mt-5 space-y-3">
          <input
            required
            placeholder="Full name"
            value={form.full_name}
            onChange={(e) => setForm((prev) => ({ ...prev, full_name: e.target.value }))}
            className="w-full rounded-lg bg-white/5 px-4 py-3 outline-none ring-1 ring-white/10 focus:ring-brand-500"
          />
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
          <input
            type="password"
            required
            minLength={8}
            placeholder="Confirm password"
            value={form.confirm_password}
            onChange={(e) => setForm((prev) => ({ ...prev, confirm_password: e.target.value }))}
            className="w-full rounded-lg bg-white/5 px-4 py-3 outline-none ring-1 ring-white/10 focus:ring-brand-500"
          />
        </div>

        <button
          disabled={loading}
          className="mt-5 w-full rounded-lg bg-brand-500 py-3 font-semibold transition duration-300 hover:bg-brand-700 disabled:opacity-60"
        >
          {loading ? "Creating account..." : "Register"}
        </button>

        <p className="mt-4 text-center text-sm text-white/65">
          Already have an account? {" "}
          <Link to="/login" className="text-brand-300 hover:text-brand-100">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}
