/*
  # Fix Exchange Rates UPDATE Policy

  1. Changes
    - Simplify UPDATE policy to allow all authenticated users to update exchange rates
    - Remove the updated_by restriction since exchange rates are shared system-wide

  2. Security
    - RLS remains enabled
    - Only authenticated users can update
    - The updated_by field tracks who made changes but doesn't restrict updates
*/

-- Drop the restrictive update policy
DROP POLICY IF EXISTS "Authenticated users can update all exchange rates" ON exchange_rates;

-- Create new policy that allows all authenticated users to update
CREATE POLICY "Authenticated users can update all exchange rates"
  ON exchange_rates
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);
