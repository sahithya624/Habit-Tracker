import { create } from "zustand";

const getStoredUser = () => {
  const raw = localStorage.getItem("hf_user");
  return raw ? JSON.parse(raw) : null;
};

export const useAuthStore = create((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  login: (userData, token) => {
    localStorage.setItem("hf_user", JSON.stringify(userData));
    localStorage.setItem("hf_token", token);
    set({ user: userData, token, isAuthenticated: true });
  },
  logout: () => {
    localStorage.removeItem("hf_user");
    localStorage.removeItem("hf_token");
    set({ user: null, token: null, isAuthenticated: false });
  },
  initialize: () => {
    const token = localStorage.getItem("hf_token");
    const user = getStoredUser();
    if (token && user) {
      set({ user, token, isAuthenticated: true });
    }
  },
  setUser: (user) => {
    localStorage.setItem("hf_user", JSON.stringify(user));
    set({ user });
  },
}));
