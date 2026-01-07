/*
  # Super Admin Access to All Tables - RLS Policies

  Run this SQL in your Supabase SQL Editor to enable super admin access to all data.

  This migration adds policies that allow super_admin users to view and manage
  all data across all tables while maintaining data isolation for regular users.
*/

-- ============================================
-- ACCOUNTS TABLE
-- ============================================

CREATE POLICY IF NOT EXISTS "Super admins can view all accounts"
  ON accounts FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'super_admin'
    )
  );

CREATE POLICY IF NOT EXISTS "Super admins can insert all accounts"
  ON accounts FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'super_admin'
    )
  );

CREATE POLICY IF NOT EXISTS "Super admins can update all accounts"
  ON accounts FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'super_admin'
    )
  );

CREATE POLICY IF NOT EXISTS "Super admins can delete all accounts"
  ON accounts FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'super_admin'
    )
  );

-- ============================================
-- EXCHANGE_RATES TABLE
-- ============================================

CREATE POLICY IF NOT EXISTS "Super admins can view all exchange rates"
  ON exchange_rates FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'super_admin'
    )
  );

CREATE POLICY IF NOT EXISTS "Super admins can insert all exchange rates"
  ON exchange_rates FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'super_admin'
    )
  );

CREATE POLICY IF NOT EXISTS "Super admins can update all exchange rates"
  ON exchange_rates FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'super_admin'
    )
  );

CREATE POLICY IF NOT EXISTS "Super admins can delete all exchange rates"
  ON exchange_rates FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'super_admin'
    )
  );

-- ============================================
-- INCOME TABLE
-- ============================================

CREATE POLICY IF NOT EXISTS "Super admins can view all income"
  ON income FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'super_admin'
    )
  );

CREATE POLICY IF NOT EXISTS "Super admins can insert all income"
  ON income FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'super_admin'
    )
  );

CREATE POLICY IF NOT EXISTS "Super admins can update all income"
  ON income FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'super_admin'
    )
  );

CREATE POLICY IF NOT EXISTS "Super admins can delete all income"
  ON income FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'super_admin'
    )
  );

-- ============================================
-- EXPENSES TABLE
-- ============================================

CREATE POLICY IF NOT EXISTS "Super admins can view all expenses"
  ON expenses FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'super_admin'
    )
  );

CREATE POLICY IF NOT EXISTS "Super admins can insert all expenses"
  ON expenses FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'super_admin'
    )
  );

CREATE POLICY IF NOT EXISTS "Super admins can update all expenses"
  ON expenses FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'super_admin'
    )
  );

CREATE POLICY IF NOT EXISTS "Super admins can delete all expenses"
  ON expenses FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'super_admin'
    )
  );

-- ============================================
-- NOTIFICATIONS TABLE
-- ============================================

CREATE POLICY IF NOT EXISTS "Super admins can view all notifications"
  ON notifications FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'super_admin'
    )
  );

-- ============================================
-- NOTIFICATION_SETTINGS TABLE
-- ============================================

CREATE POLICY IF NOT EXISTS "Super admins can view all notification settings"
  ON notification_settings FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'super_admin'
    )
  );

-- ============================================
-- PROFIT_DISTRIBUTION TABLE
-- ============================================

CREATE POLICY IF NOT EXISTS "Super admins can view all profit distribution"
  ON profit_distribution FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'super_admin'
    )
  );

CREATE POLICY IF NOT EXISTS "Super admins can insert all profit distribution"
  ON profit_distribution FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'super_admin'
    )
  );

CREATE POLICY IF NOT EXISTS "Super admins can update all profit distribution"
  ON profit_distribution FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'super_admin'
    )
  );

CREATE POLICY IF NOT EXISTS "Super admins can delete all profit distribution"
  ON profit_distribution FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'super_admin'
    )
  );

-- ============================================
-- VERIFICATION
-- ============================================

-- Run this query to verify all policies are created:
SELECT
  schemaname,
  tablename,
  policyname
FROM pg_policies
WHERE policyname LIKE '%Super admin%'
ORDER BY tablename, policyname;
