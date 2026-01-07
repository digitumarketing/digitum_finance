/*
  Fix Super Admin Delete User Permissions

  INSTRUCTIONS:
  1. Go to your Supabase Dashboard
  2. Navigate to SQL Editor
  3. Copy and paste this entire SQL script
  4. Click "Run" to execute

  This script ensures super admins can delete users and all their associated data.
*/

-- ============================================================================
-- ENSURE SUPER ADMIN CAN DELETE FROM ALL TABLES
-- ============================================================================

-- First, drop any existing restrictive policies that might conflict
DO $$
BEGIN
  -- notifications
  DROP POLICY IF EXISTS "Super admins can delete any notifications" ON notifications;

  -- notification_settings
  DROP POLICY IF EXISTS "Super admins can delete any notification settings" ON notification_settings;

  -- expenses
  DROP POLICY IF EXISTS "Super admins can delete any expenses" ON expenses;

  -- income
  DROP POLICY IF EXISTS "Super admins can delete any income" ON income;

  -- exchange_rates
  DROP POLICY IF EXISTS "Super admins can delete any exchange rates" ON exchange_rates;

  -- accounts
  DROP POLICY IF EXISTS "Super admins can delete any accounts" ON accounts;

  -- user_profiles
  DROP POLICY IF EXISTS "Super admins can delete user profiles" ON user_profiles;
END $$;

-- Now create the correct policies for super admin delete

-- NOTIFICATIONS
CREATE POLICY "Super admins can delete any notifications" ON notifications
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role = 'super_admin'
      AND is_active = true
    )
  );

-- NOTIFICATION SETTINGS
CREATE POLICY "Super admins can delete any notification settings" ON notification_settings
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role = 'super_admin'
      AND is_active = true
    )
  );

-- EXPENSES
CREATE POLICY "Super admins can delete any expenses" ON expenses
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role = 'super_admin'
      AND is_active = true
    )
  );

-- INCOME
CREATE POLICY "Super admins can delete any income" ON income
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role = 'super_admin'
      AND is_active = true
    )
  );

-- EXCHANGE RATES
CREATE POLICY "Super admins can delete any exchange rates" ON exchange_rates
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role = 'super_admin'
      AND is_active = true
    )
  );

-- ACCOUNTS
CREATE POLICY "Super admins can delete any accounts" ON accounts
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role = 'super_admin'
      AND is_active = true
    )
  );

-- USER PROFILES
CREATE POLICY "Super admins can delete user profiles" ON user_profiles
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid()
      AND up.role = 'super_admin'
      AND up.is_active = true
    )
  );

-- Verify the policies were created
SELECT
  schemaname,
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE policyname LIKE '%Super admins can delete%'
ORDER BY tablename, policyname;
