/*
  # Update Accounts and Exchange Rates RLS for Shared Access

  1. Changes
    - Drop existing "Users can manage own accounts" policy
    - Drop existing "Users can manage own exchange rates" policy
    - Create new policies to allow all users to view all accounts and exchange rates
    - Restrict account and exchange rate management to super_admin only

  2. New Policies for Accounts
    - All authenticated users can SELECT (read) all accounts
    - Only super_admin can INSERT new accounts
    - Only super_admin can UPDATE accounts
    - Only super_admin can DELETE accounts

  3. New Policies for Exchange Rates
    - All authenticated users can SELECT (read) all exchange rates
    - Only super_admin can INSERT new exchange rates
    - Only super_admin can UPDATE exchange rates
    - Only super_admin can DELETE exchange rates

  4. Rationale
    - Accounts and exchange rates are company-wide resources
    - All users need to see accounts and rates to add income/expenses
    - Only super_admin should manage these company-wide settings
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can manage own accounts" ON accounts;
DROP POLICY IF EXISTS "Users can manage own exchange rates" ON exchange_rates;

-- ===== ACCOUNTS POLICIES =====

-- Allow all authenticated users to read all accounts
CREATE POLICY "All users can view all accounts"
  ON accounts
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() AND up.is_active = true
    )
  );

-- Only super_admin can insert new accounts
CREATE POLICY "Super admin can insert accounts"
  ON accounts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() AND up.role = 'super_admin' AND up.is_active = true
    )
  );

-- Only super_admin can update accounts
CREATE POLICY "Super admin can update accounts"
  ON accounts
  FOR UPDATE
  TO authenticated
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

-- Only super_admin can delete accounts
CREATE POLICY "Super admin can delete accounts"
  ON accounts
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() AND up.role = 'super_admin' AND up.is_active = true
    )
  );

-- ===== EXCHANGE RATES POLICIES =====

-- Allow all authenticated users to read all exchange rates
CREATE POLICY "All users can view all exchange rates"
  ON exchange_rates
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() AND up.is_active = true
    )
  );

-- Only super_admin can insert new exchange rates
CREATE POLICY "Super admin can insert exchange rates"
  ON exchange_rates
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() AND up.role = 'super_admin' AND up.is_active = true
    )
  );

-- Only super_admin can update exchange rates
CREATE POLICY "Super admin can update exchange rates"
  ON exchange_rates
  FOR UPDATE
  TO authenticated
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

-- Only super_admin can delete exchange rates
CREATE POLICY "Super admin can delete exchange rates"
  ON exchange_rates
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() AND up.role = 'super_admin' AND up.is_active = true
    )
  );
