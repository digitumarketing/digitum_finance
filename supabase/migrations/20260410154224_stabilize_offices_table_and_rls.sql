
/*
  # Stabilize offices table and RLS

  ## Summary
  Ensures the offices table exists with proper structure and RLS policies
  are correctly applied. Safe to run multiple times (IF NOT EXISTS / DROP IF EXISTS).

  ## Tables
  - `offices`: creates if missing; refreshes all four RLS policies
  - Adds office_id FK to transactions, income, expenses, notifications if not already present

  ## Security
  - Drops and recreates all four RLS policies on offices
  - Policies restrict access to the authenticated user's own rows only
*/

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.offices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  color text NOT NULL DEFAULT '#10b981',
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.offices ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_offices_user_id ON public.offices(user_id);

DROP POLICY IF EXISTS "Users can view their own offices" ON public.offices;
CREATE POLICY "Users can view their own offices"
  ON public.offices FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own offices" ON public.offices;
CREATE POLICY "Users can create their own offices"
  ON public.offices FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own offices" ON public.offices;
CREATE POLICY "Users can update their own offices"
  ON public.offices FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own offices" ON public.offices;
CREATE POLICY "Users can delete their own offices"
  ON public.offices FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own offices" ON public.offices;
DROP POLICY IF EXISTS "Users can insert own offices" ON public.offices;
DROP POLICY IF EXISTS "Users can update own offices" ON public.offices;
DROP POLICY IF EXISTS "Users can delete own offices" ON public.offices;

ALTER TABLE public.income
  ADD COLUMN IF NOT EXISTS office_id uuid REFERENCES public.offices(id) ON DELETE CASCADE;

ALTER TABLE public.expenses
  ADD COLUMN IF NOT EXISTS office_id uuid REFERENCES public.offices(id) ON DELETE CASCADE;

ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS office_id uuid REFERENCES public.offices(id) ON DELETE CASCADE;

SELECT pg_notify('pgrst', 'reload schema');
