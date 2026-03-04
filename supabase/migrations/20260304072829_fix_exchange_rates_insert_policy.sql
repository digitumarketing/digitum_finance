/*
  # Fix Exchange Rates INSERT Policy

  1. Changes
    - Drop the restrictive INSERT policy that requires user_id matching
    - Create new INSERT policy that allows any authenticated user to insert exchange rates
    - Since exchange rates are shared system-wide, we just verify the user is authenticated

  2. Security
    - RLS remains enabled
    - Only authenticated users can insert
    - User ID will be recorded for audit purposes but doesn't restrict insertion
*/

-- Drop the restrictive insert policy
DROP POLICY IF EXISTS "Authenticated users can insert exchange rates" ON exchange_rates;

-- Create new policy that allows all authenticated users to insert
CREATE POLICY "Authenticated users can insert exchange rates"
  ON exchange_rates
  FOR INSERT
  TO authenticated
  WITH CHECK (true);
