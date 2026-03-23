-- ============================================================
-- OJT DTR System — Supabase SQL Setup
-- Run this in your Supabase SQL Editor (supabase.com/dashboard)
-- ============================================================

-- 1. Profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id             UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name      TEXT NOT NULL,
  student_id     TEXT UNIQUE,
  program        TEXT DEFAULT 'BSIT',
  course_code    TEXT DEFAULT 'ITEC 199',
  total_required_hours INTEGER DEFAULT 486,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policies: users can only read/write their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);


-- 2. Trigger: auto-create profile from user metadata on signup
--    This runs as a privileged DB function (bypasses RLS), so it works
--    even before the user confirms their email.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, student_id, program, course_code, total_required_hours)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Unknown'),
    NEW.raw_user_meta_data->>'student_id',
    COALESCE(NEW.raw_user_meta_data->>'program', 'BSIT'),
    COALESCE(NEW.raw_user_meta_data->>'course_code', 'ITEC 199'),
    COALESCE((NEW.raw_user_meta_data->>'total_required_hours')::INTEGER, 486)
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Drop trigger first if it already exists, then recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- 2. Time records table
CREATE TABLE IF NOT EXISTS public.time_records (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date             DATE NOT NULL,
  time_in          TIME,
  time_out         TIME,
  hours_rendered   NUMERIC(5,2),
  is_manual        BOOLEAN DEFAULT FALSE,
  record_type      TEXT DEFAULT 'regular',  -- 'regular' | 'absent'
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- If you already created the table, run this to add the column:
-- ALTER TABLE public.time_records ADD COLUMN IF NOT EXISTS record_type TEXT DEFAULT 'regular';

-- Enable Row Level Security
ALTER TABLE public.time_records ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own records"
  ON public.time_records FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own records"
  ON public.time_records FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own records"
  ON public.time_records FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own records"
  ON public.time_records FOR DELETE
  USING (auth.uid() = user_id);
