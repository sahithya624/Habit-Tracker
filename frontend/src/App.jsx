import { lazy, Suspense } from "react";
import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import Sidebar from "./components/layout/Sidebar";
import Topbar from "./components/layout/Topbar";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import ErrorBoundary from "./components/ui/ErrorBoundary";
import LoadingSpinner from "./components/ui/LoadingSpinner";

const Landing = lazy(() => import("./pages/Landing"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const HabitLog = lazy(() => import("./pages/HabitLog"));
const MoodTracker = lazy(() => import("./pages/MoodTracker"));
const Analytics = lazy(() => import("./pages/Analytics"));
const AICoach = lazy(() => import("./pages/AICoach"));
const WeeklySummary = lazy(() => import("./pages/WeeklySummary"));
const Settings = lazy(() => import("./pages/Settings"));

function AppShell() {
  return (
    <div className="min-h-screen bg-bg-deep text-white">
      <Sidebar />
      <div className="md:pl-60">
        <Topbar />
        <main className="p-4 pb-24 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center gradient-bg">
          <LoadingSpinner label="Loading HabitFlow AI..." />
        </div>
      }
    >
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          <Route
            path="/dashboard"
            element={
              <ErrorBoundary>
                <Dashboard />
              </ErrorBoundary>
            }
          />
          <Route path="/habits" element={<HabitLog />} />
          <Route path="/mood" element={<MoodTracker />} />
          <Route
            path="/analytics"
            element={
              <ErrorBoundary>
                <Analytics />
              </ErrorBoundary>
            }
          />
          <Route
            path="/coach"
            element={
              <ErrorBoundary>
                <AICoach />
              </ErrorBoundary>
            }
          />
          <Route path="/summaries" element={<WeeklySummary />} />
          <Route path="/settings" element={<Settings />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
