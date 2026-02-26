/*
  # Fix Income RLS Policies
  
  1. Changes
    - Drop the existing "FOR ALL" policy
    - Create separate policies for SELECT, INSERT, UPDATE, and DELETE operations
    - Add super_admin policies for full access
  
  2. Security
    - Users can only manage their own income records
    - Super admins can manage all income records
    - Proper separation of concerns for each operation type
*/

-- Drop existing policy
DROP POLICY IF EXISTS "Users can manage own income" ON income;

-- SELECT policy for regular users
CREATE POLICY "Users can view own income"
  ON income
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- INSERT policy for regular users
CREATE POLICY "Users can insert own income"
  ON income
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- UPDATE policy for regular users
CREATE POLICY "Users can update own income"
  ON income
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE policy for regular users
CREATE POLICY "Users can delete own income"
  ON income
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Super admin policies for full access
CREATE POLICY "Super admins can view all income"
  ON income
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'super_admin'
    )
  );

CREATE POLICY "Super admins can insert all income"
  ON income
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'super_admin'
    )
  );

CREATE POLICY "Super admins can update all income"
  ON income
  FOR UPDATE
  TO authenticated
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

CREATE POLICY "Super admins can delete all income"
  ON income
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'super_admin'
    )
  );
