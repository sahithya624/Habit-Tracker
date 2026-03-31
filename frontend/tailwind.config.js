/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        bg: {
          deep: "#0f1117",
          panel: "#1a1d2e",
          muted: "#22263a",
        },
        brand: {
          50: "#eef0ff",
          100: "#dfe3ff",
          300: "#a8b2ff",
          500: "#6366f1",
          700: "#4f46e5",
          900: "#2f2d7e",
        },
        success: "#10b981",
        warning: "#f59e0b",
        danger: "#f43f5e",
      },
      fontFamily: {
        sans: ["DM Sans", "sans-serif"],
        display: ["Playfair Display", "serif"],
      },
      boxShadow: {
        glass: "0 8px 32px rgba(15, 17, 23, 0.35)",
      },
      transitionDuration: {
        300: "300ms",
      },
      keyframes: {
        floatIn: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        floatIn: "floatIn 0.5s ease forwards",
      },
    },
  },
  plugins: [],
};
