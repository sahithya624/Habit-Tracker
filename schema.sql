-- HabitFlow AI Supabase Schema
-- Run this entire file in Supabase SQL Editor.

-- Required for gen_random_uuid()
create extension if not exists pgcrypto;

-- USERS PROFILE TABLE (linked to Supabase auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text unique not null,
  avatar_url text,
  timezone text default 'UTC',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- HABITS TABLE
create table if not exists public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  name text not null,
  category text not null check (category in ('exercise', 'sleep', 'reading', 'productivity', 'custom')),
  target_frequency text default 'daily' check (target_frequency in ('daily', 'weekly')),
  target_value double precision,
  unit text,
  color text default '#6366f1',
  icon text default '✅',
  is_active boolean default true,
  created_at timestamptz default now()
);

-- HABIT LOGS TABLE
create table if not exists public.habit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  habit_id uuid references public.habits(id) on delete cascade,
  logged_date date not null,
  value double precision not null default 1,
  notes text,
  created_at timestamptz default now(),
  unique(habit_id, logged_date)
);

-- MOOD LOGS TABLE
create table if not exists public.mood_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  logged_date date not null,
  mood_score integer check (mood_score between 1 and 10),
  productivity_score integer check (productivity_score between 1 and 10),
  energy_score integer check (energy_score between 1 and 10),
  stress_score integer check (stress_score between 1 and 10),
  notes text,
  created_at timestamptz default now(),
  unique(user_id, logged_date)
);

-- AI WEEKLY SUMMARIES TABLE
create table if not exists public.ai_summaries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  week_start date not null,
  week_end date not null,
  summary_text text,
  recommendations jsonb,
  burnout_risk_score double precision,
  burnout_risk_level text check (burnout_risk_level in ('low', 'moderate', 'high', 'critical')),
  patterns_detected jsonb,
  created_at timestamptz default now(),
  unique(user_id, week_start)
);

-- AI COACH CONVERSATION TABLE
create table if not exists public.coach_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz default now()
);

-- Helpful indexes
create index if not exists idx_habits_user_active on public.habits(user_id, is_active);
create index if not exists idx_habit_logs_user_date on public.habit_logs(user_id, logged_date);
create index if not exists idx_habit_logs_habit_date on public.habit_logs(habit_id, logged_date);
create index if not exists idx_mood_logs_user_date on public.mood_logs(user_id, logged_date);
create index if not exists idx_ai_summaries_user_week on public.ai_summaries(user_id, week_start desc);
create index if not exists idx_coach_conversations_user_created on public.coach_conversations(user_id, created_at);

-- Keep profiles.updated_at fresh
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

-- Enable Row Level Security
alter table public.profiles enable row level security;
alter table public.habits enable row level security;
alter table public.habit_logs enable row level security;
alter table public.mood_logs enable row level security;
alter table public.ai_summaries enable row level security;
alter table public.coach_conversations enable row level security;

-- Policies (users can only access their own data)
drop policy if exists "Users own profiles" on public.profiles;
create policy "Users own profiles"
  on public.profiles
  for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "Users own habits" on public.habits;
create policy "Users own habits"
  on public.habits
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users own habit_logs" on public.habit_logs;
create policy "Users own habit_logs"
  on public.habit_logs
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users own mood_logs" on public.mood_logs;
create policy "Users own mood_logs"
  on public.mood_logs
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users own ai_summaries" on public.ai_summaries;
create policy "Users own ai_summaries"
  on public.ai_summaries
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users own coach_conversations" on public.coach_conversations;
create policy "Users own coach_conversations"
  on public.coach_conversations
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
