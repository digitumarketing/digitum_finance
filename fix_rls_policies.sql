/*
  Fix RLS Policies for Super Admin and User Management

  INSTRUCTIONS:
  1. Go to your Supabase Dashboard
  2. Navigate to SQL Editor
  3. Copy and paste this entire SQL script
  4. Click "Run" to execute

  This script fixes:
  - Super admins can create/delete users and their resources
  - New users can see their default accounts
  - Manager users can view and edit income/expenses on their accounts
*/

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Super admins can manage all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can manage own accounts" ON accounts;
DROP POLICY IF EXISTS "Users can manage own exchange rates" ON exchange_rates;
DROP POLICY IF EXISTS "Users can manage own notification settings" ON notification_settings;

-- ============================================================================
-- USER PROFILES TABLE POLICIES
-- ============================================================================

-- Super admins can insert user profiles
CREATE POLICY "Super admins can insert user profiles" ON user_profiles
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() AND up.role = 'super_admin' AND up.is_active = true
    )
  );

-- Super admins can update user profiles
CREATE POLICY "Super admins can update user profiles" ON user_profiles
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() AND up.role = 'super_admin' AND up.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() AND up.role = 'super_admin' AND up.is_active = true
    )
  );

-- Super admins can delete user profiles
CREATE POLICY "Super admins can delete user profiles" ON user_profiles
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() AND up.role = 'super_admin' AND up.is_active = true
    )
  );

-- ============================================================================
-- ACCOUNTS TABLE POLICIES
-- ============================================================================

-- Users can view their own accounts
CREATE POLICY "Users can view own accounts" ON accounts
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Super admins can view all accounts
CREATE POLICY "Super admins can view all accounts" ON accounts
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'super_admin' AND is_active = true
    )
  );

-- Users can insert their own accounts
CREATE POLICY "Users can insert own accounts" ON accounts
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Super admins can insert accounts for any user
CREATE POLICY "Super admins can insert any accounts" ON accounts
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'super_admin' AND is_active = true
    )
  );

-- Users can update their own accounts
CREATE POLICY "Users can update own accounts" ON accounts
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own accounts
CREATE POLICY "Users can delete own accounts" ON accounts
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Super admins can delete any accounts
CREATE POLICY "Super admins can delete any accounts" ON accounts
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'super_admin' AND is_active = true
    )
  );

-- ============================================================================
-- EXCHANGE RATES TABLE POLICIES
-- ============================================================================

-- Users can view their own exchange rates
CREATE POLICY "Users can view own exchange rates" ON exchange_rates
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Super admins can view all exchange rates
CREATE POLICY "Super admins can view all exchange rates" ON exchange_rates
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'super_admin' AND is_active = true
    )
  );

-- Users can insert their own exchange rates
CREATE POLICY "Users can insert own exchange rates" ON exchange_rates
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Super admins can insert exchange rates for any user
CREATE POLICY "Super admins can insert any exchange rates" ON exchange_rates
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'super_admin' AND is_active = true
    )
  );

-- Users can update their own exchange rates
CREATE POLICY "Users can update own exchange rates" ON exchange_rates
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own exchange rates
CREATE POLICY "Users can delete own exchange rates" ON exchange_rates
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Super admins can delete any exchange rates
CREATE POLICY "Super admins can delete any exchange rates" ON exchange_rates
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'super_admin' AND is_active = true
    )
  );

-- ============================================================================
-- NOTIFICATION SETTINGS TABLE POLICIES
-- ============================================================================

-- Users can view their own notification settings
CREATE POLICY "Users can view own notification settings" ON notification_settings
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Super admins can view all notification settings
CREATE POLICY "Super admins can view all notification settings" ON notification_settings
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'super_admin' AND is_active = true
    )
  );

-- Users can insert their own notification settings
CREATE POLICY "Users can insert own notification settings" ON notification_settings
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Super admins can insert notification settings for any user
CREATE POLICY "Super admins can insert any notification settings" ON notification_settings
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'super_admin' AND is_active = true
    )
  );

-- Users can update their own notification settings
CREATE POLICY "Users can update own notification settings" ON notification_settings
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own notification settings
CREATE POLICY "Users can delete own notification settings" ON notification_settings
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Super admins can delete any notification settings
CREATE POLICY "Super admins can delete any notification settings" ON notification_settings
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'super_admin' AND is_active = true
    )
  );

-- ============================================================================
-- INCOME TABLE POLICIES
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can manage own income" ON income;

-- Users can view their own income
CREATE POLICY "Users can view own income" ON income
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Super admins can view all income
CREATE POLICY "Super admins can view all income" ON income
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'super_admin' AND is_active = true
    )
  );

-- Users can insert their own income
CREATE POLICY "Users can insert own income" ON income
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own income
CREATE POLICY "Users can update own income" ON income
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own income
CREATE POLICY "Users can delete own income" ON income
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Super admins can delete any income
CREATE POLICY "Super admins can delete any income" ON income
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'super_admin' AND is_active = true
    )
  );

-- ============================================================================
-- EXPENSES TABLE POLICIES
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can manage own expenses" ON expenses;

-- Users can view their own expenses
CREATE POLICY "Users can view own expenses" ON expenses
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Super admins can view all expenses
CREATE POLICY "Super admins can view all expenses" ON expenses
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'super_admin' AND is_active = true
    )
  );

-- Users can insert their own expenses
CREATE POLICY "Users can insert own expenses" ON expenses
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own expenses
CREATE POLICY "Users can update own expenses" ON expenses
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own expenses
CREATE POLICY "Users can delete own expenses" ON expenses
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Super admins can delete any expenses
CREATE POLICY "Super admins can delete any expenses" ON expenses
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'super_admin' AND is_active = true
    )
  );

-- ============================================================================
-- NOTIFICATIONS TABLE POLICIES
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can manage own notifications" ON notifications;

-- Users can view their own notifications
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert their own notifications
CREATE POLICY "Users can insert own notifications" ON notifications
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own notifications
CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own notifications
CREATE POLICY "Users can delete own notifications" ON notifications
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Super admins can delete any notifications
CREATE POLICY "Super admins can delete any notifications" ON notifications
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'super_admin' AND is_active = true
    )
  );
