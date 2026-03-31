# HabitFlow AI - Smart Habit & Behavior Tracker

Production-grade SaaS-style full-stack habit tracking platform with AI summaries, burnout analytics, and coaching.

## Tech Stack

### Backend
- Python 3.11+
- FastAPI (async endpoints)
- Supabase PostgreSQL (`supabase-py`)
- Groq API (`llama3-8b-8192`)
- APScheduler (weekly summary cron)
- JWT auth (`python-jose`)
- Pydantic v2 models

### Frontend
- React 18 + Vite
- React Router v6
- TailwindCSS
- Recharts
- Axios
- TanStack Query
- Zustand
- date-fns
- Lucide React

## 1) Supabase Setup

1. Create a new Supabase project.
2. Open SQL Editor and run:

```sql
-- USERS TABLE (supplement Supabase auth with profile data)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  timezone TEXT DEFAULT 'UTC',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- HABITS TABLE (habit definitions per user)
CREATE TABLE habits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  target_frequency TEXT DEFAULT 'daily',
  target_value FLOAT,
  unit TEXT,
  color TEXT DEFAULT '#6366f1',
  icon TEXT DEFAULT '✅',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- HABIT LOGS TABLE (daily entries)
CREATE TABLE habit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  habit_id UUID REFERENCES habits(id) ON DELETE CASCADE,
  logged_date DATE NOT NULL,
  value FLOAT NOT NULL DEFAULT 1,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(habit_id, logged_date)
);

-- MOOD & PRODUCTIVITY LOGS
CREATE TABLE mood_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  logged_date DATE NOT NULL,
  mood_score INTEGER CHECK (mood_score BETWEEN 1 AND 10),
  productivity_score INTEGER CHECK (productivity_score BETWEEN 1 AND 10),
  energy_score INTEGER CHECK (energy_score BETWEEN 1 AND 10),
  stress_score INTEGER CHECK (stress_score BETWEEN 1 AND 10),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, logged_date)
);

-- AI SUMMARIES TABLE
CREATE TABLE ai_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  summary_text TEXT,
  recommendations JSONB,
  burnout_risk_score FLOAT,
  burnout_risk_level TEXT,
  patterns_detected JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, week_start)
);

-- AI COACH CONVERSATIONS
CREATE TABLE coach_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE mood_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users own profiles" ON profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "Users own habits" ON habits FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own habit_logs" ON habit_logs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own mood_logs" ON mood_logs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own ai_summaries" ON ai_summaries FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own coach_conversations" ON coach_conversations FOR ALL USING (auth.uid() = user_id);
```

3. In Supabase Auth settings, ensure email/password auth is enabled.
4. Copy project URL, `anon` key, and `service_role` key.

## 2) Groq API Key

1. Go to `https://console.groq.com`.
2. Create an API key (free tier).
3. Save it for backend `.env`.

## 3) Environment Variables

### Backend (`backend/.env`)
Use `backend/.env.example` as template:

```env
SUPABASE_URL=
SUPABASE_SERVICE_KEY=
SUPABASE_ANON_KEY=
GROQ_API_KEY=
JWT_SECRET=
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080
FRONTEND_URL=http://localhost:5173
```

### Frontend (`frontend/.env`)
Use `frontend/.env.example`:

```env
VITE_API_URL=http://localhost:8000
```

## 4) Local Development

### Backend
```bash
cd backend
python -m venv .venv
# Windows
.venv\Scripts\activate
# macOS/Linux
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

App URLs:
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8000`
- Health check: `http://localhost:8000/health`

## 5) Deployment

### Backend on Render
1. Create a new Web Service from `backend/`.
2. Use `backend/render.yaml`.
3. Set environment variables from `.env`.
4. Deploy and copy backend URL.

### Frontend on Vercel
1. Import `frontend/` as a Vercel project.
2. `frontend/vercel.json` is already configured with SPA rewrites.
3. Set secret/env `habit_tracker_api_url` to your Render backend URL.
4. Deploy.

## 6) Scheduler

- APScheduler runs weekly summary generation every Sunday at **11:59 PM UTC**.
- Runs in FastAPI lifespan startup and uses service-role Supabase client for admin operations.

## 7) API Notes

- Public endpoints: `/auth/register`, `/auth/login`, `/health`
- All other endpoints require Bearer JWT from login/register response.
- User-facing DB calls use Supabase user-scoped clients for RLS compliance.

## 8) Project Commands

Backend:
```bash
uvicorn main:app --reload
```

Frontend:
```bash
npm run dev
npm run build
```
