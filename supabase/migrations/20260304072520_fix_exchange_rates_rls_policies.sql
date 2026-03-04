/*
  # Fix Exchange Rates RLS Policies

  1. Changes
    - Drop existing restrictive RLS policies on exchange_rates table
    - Create new policies allowing all authenticated users to manage exchange rates
    - Exchange rates are shared system-wide data, not user-specific

  2. New Policies
    - Authenticated users can view all exchange rates
    - Authenticated users can insert new exchange rates
    - Authenticated users can update all exchange rates
    - Authenticated users can delete exchange rates

  3. Security
    - RLS remains enabled on exchange_rates table
    - Only authenticated users can access exchange rates
    - All authenticated users have full CRUD access (shared resource)
*/

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view own exchange rates" ON exchange_rates;
DROP POLICY IF EXISTS "Users can insert own exchange rates" ON exchange_rates;
DROP POLICY IF EXISTS "Users can update own exchange rates" ON exchange_rates;
DROP POLICY IF EXISTS "Users can delete own exchange rates" ON exchange_rates;

-- Create new policies for shared access
CREATE POLICY "Authenticated users can view all exchange rates"
  ON exchange_rates
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert exchange rates"
  ON exchange_rates
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can update all exchange rates"
  ON exchange_rates
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (auth.uid() = updated_by OR updated_by IS NULL);

CREATE POLICY "Authenticated users can delete exchange rates"
  ON exchange_rates
  FOR DELETE
  TO authenticated
  USING (true);
