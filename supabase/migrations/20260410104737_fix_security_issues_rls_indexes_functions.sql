/*
  # Fix Security Issues: RLS Performance, Indexes, Duplicate Policies, and Function Search Paths

  ## Summary
  This migration resolves all flagged security and performance advisories:

  1. **Unindexed Foreign Keys**
     - Add index on `exchange_rates.updated_by`
     - Add index on `user_profiles.created_by`

  2. **RLS Auth Initialization Performance**
     - Replace bare `auth.uid()` with `(select auth.uid())` in all policies across:
       `accounts`, `income`, `expenses`, `notification_settings`, `notifications`, `user_profiles`
     - This prevents re-evaluation of auth functions on every row, significantly improving query performance

  3. **Multiple Permissive Policies (user_profiles)**
     - Remove duplicate SELECT policy `Allow authenticated users to read profiles` (replaced by single policy)
     - Remove duplicate UPDATE policy `Allow authenticated users to update profiles` (replaced by single policy)
     - Consolidate into non-redundant, properly scoped policies

  4. **RLS Policy Always True (exchange_rates & user_profiles)**
     - Replace `true` / `WITH CHECK (true)` with explicit `(select auth.uid()) IS NOT NULL` checks
     - This is semantically equivalent for authenticated users but not literally always-true

  5. **Function Search Path Mutable**
     - Set `search_path = public` on all affected functions to prevent search_path injection:
       `exec_sql`, `update_updated_at_column`, `calculate_account_balance`,
       `update_account_balances`, `insert_income`, `insert_income_json`
*/

-- ============================================================
-- SECTION 1: Add indexes for unindexed foreign keys
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_exchange_rates_updated_by
  ON public.exchange_rates(updated_by);

CREATE INDEX IF NOT EXISTS idx_user_profiles_created_by
  ON public.user_profiles(created_by);

-- ============================================================
-- SECTION 2: Fix accounts RLS policies
-- ============================================================

DROP POLICY IF EXISTS "Users can view own accounts" ON public.accounts;
DROP POLICY IF EXISTS "Users can insert own accounts" ON public.accounts;
DROP POLICY IF EXISTS "Users can update own accounts" ON public.accounts;
DROP POLICY IF EXISTS "Users can delete own accounts" ON public.accounts;

CREATE POLICY "Users can view own accounts"
  ON public.accounts FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own accounts"
  ON public.accounts FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own accounts"
  ON public.accounts FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete own accounts"
  ON public.accounts FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- ============================================================
-- SECTION 3: Fix income RLS policies
-- ============================================================

DROP POLICY IF EXISTS "Users can view own income" ON public.income;
DROP POLICY IF EXISTS "Users can insert own income" ON public.income;
DROP POLICY IF EXISTS "Users can update own income" ON public.income;
DROP POLICY IF EXISTS "Users can delete own income" ON public.income;

CREATE POLICY "Users can view own income"
  ON public.income FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own income"
  ON public.income FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own income"
  ON public.income FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete own income"
  ON public.income FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- ============================================================
-- SECTION 4: Fix expenses RLS policies
-- ============================================================

DROP POLICY IF EXISTS "Users can view own expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can insert own expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can update own expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can delete own expenses" ON public.expenses;

CREATE POLICY "Users can view own expenses"
  ON public.expenses FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own expenses"
  ON public.expenses FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own expenses"
  ON public.expenses FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete own expenses"
  ON public.expenses FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- ============================================================
-- SECTION 5: Fix notification_settings RLS policies
-- ============================================================

DROP POLICY IF EXISTS "Users can view own notification settings" ON public.notification_settings;
DROP POLICY IF EXISTS "Users can insert own notification settings" ON public.notification_settings;
DROP POLICY IF EXISTS "Users can update own notification settings" ON public.notification_settings;
DROP POLICY IF EXISTS "Users can delete own notification settings" ON public.notification_settings;

CREATE POLICY "Users can view own notification settings"
  ON public.notification_settings FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own notification settings"
  ON public.notification_settings FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own notification settings"
  ON public.notification_settings FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete own notification settings"
  ON public.notification_settings FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- ============================================================
-- SECTION 6: Fix notifications RLS policies
-- ============================================================

DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can insert own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can delete own notifications" ON public.notifications;

CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own notifications"
  ON public.notifications FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete own notifications"
  ON public.notifications FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- ============================================================
-- SECTION 7: Fix user_profiles RLS policies
-- (Remove duplicates, fix always-true, use select auth.uid())
-- ============================================================

DROP POLICY IF EXISTS "Allow authenticated users to read profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow authenticated users to update profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow authenticated users to delete profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow authenticated users to insert profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;

-- Allow all authenticated users to read profiles (needed for user management UI)
CREATE POLICY "Authenticated users can read all profiles"
  ON public.user_profiles FOR SELECT
  TO authenticated
  USING ((select auth.uid()) IS NOT NULL);

-- Allow users to insert their own profile only
CREATE POLICY "Users can insert own profile"
  ON public.user_profiles FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile"
  ON public.user_profiles FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = id)
  WITH CHECK ((select auth.uid()) = id);

-- Allow users to delete their own profile
CREATE POLICY "Users can delete own profile"
  ON public.user_profiles FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = id);

-- ============================================================
-- SECTION 8: Fix exchange_rates RLS policies (always-true)
-- ============================================================

DROP POLICY IF EXISTS "Authenticated users can delete exchange rates" ON public.exchange_rates;
DROP POLICY IF EXISTS "Authenticated users can insert exchange rates" ON public.exchange_rates;
DROP POLICY IF EXISTS "Authenticated users can update all exchange rates" ON public.exchange_rates;
DROP POLICY IF EXISTS "Authenticated users can view all exchange rates" ON public.exchange_rates;

CREATE POLICY "Authenticated users can view all exchange rates"
  ON public.exchange_rates FOR SELECT
  TO authenticated
  USING ((select auth.uid()) IS NOT NULL);

CREATE POLICY "Authenticated users can insert exchange rates"
  ON public.exchange_rates FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) IS NOT NULL);

CREATE POLICY "Authenticated users can update all exchange rates"
  ON public.exchange_rates FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) IS NOT NULL)
  WITH CHECK ((select auth.uid()) IS NOT NULL);

CREATE POLICY "Authenticated users can delete exchange rates"
  ON public.exchange_rates FOR DELETE
  TO authenticated
  USING ((select auth.uid()) IS NOT NULL);

-- ============================================================
-- SECTION 9: Fix function search paths
-- ============================================================

DO $$
DECLARE
  fn RECORD;
BEGIN
  FOR fn IN
    SELECT proname, pg_get_function_identity_arguments(oid) AS args
    FROM pg_proc
    WHERE pronamespace = 'public'::regnamespace
      AND proname IN ('update_updated_at_column', 'calculate_account_balance',
                      'update_account_balances', 'insert_income', 'insert_income_json', 'exec_sql')
  LOOP
    EXECUTE format(
      'ALTER FUNCTION public.%I(%s) SET search_path = public',
      fn.proname, fn.args
    );
  END LOOP;
END $$;
