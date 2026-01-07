/*
  # Fix Accounts RLS for Super Admin Account Creation

  INSTRUCTIONS:
  1. Go to your Supabase Dashboard
  2. Navigate to SQL Editor
  3. Copy and paste this entire SQL script
  4. Click "Run" to execute

  This will allow super admins to create accounts, exchange rates, and
  notification settings for newly created users.
*/

-- Add policy for super admins to insert accounts for any user
CREATE POLICY "Super admins can insert accounts for any user" ON accounts
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() AND up.role = 'super_admin' AND up.is_active = true
    )
  );

-- Add policy for super admins to view all accounts
CREATE POLICY "Super admins can view all accounts" ON accounts
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() AND up.role = 'super_admin' AND up.is_active = true
    )
  );

-- Add similar policies for exchange_rates table
CREATE POLICY "Super admins can insert exchange rates for any user" ON exchange_rates
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() AND up.role = 'super_admin' AND up.is_active = true
    )
  );

CREATE POLICY "Super admins can view all exchange rates" ON exchange_rates
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() AND up.role = 'super_admin' AND up.is_active = true
    )
  );

-- Add similar policies for notification_settings table
CREATE POLICY "Super admins can insert notification settings for any user" ON notification_settings
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() AND up.role = 'super_admin' AND up.is_active = true
    )
  );

CREATE POLICY "Super admins can view all notification settings" ON notification_settings
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() AND up.role = 'super_admin' AND up.is_active = true
    )
  );
