/*
  Fix RLS Policies for Super Admin to Create User Resources

  INSTRUCTIONS:
  1. Go to your Supabase Dashboard
  2. Navigate to SQL Editor
  3. Copy and paste this entire SQL script
  4. Click "Run" to execute

  This allows super admins to create accounts, exchange rates, and
  notification settings for newly created users so they can see and use them.
*/

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can manage own accounts" ON accounts;
DROP POLICY IF EXISTS "Users can manage own exchange rates" ON exchange_rates;
DROP POLICY IF EXISTS "Users can manage own notification settings" ON notification_settings;

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
