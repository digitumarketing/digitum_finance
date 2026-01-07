/*
  Fix User Profiles RLS Policies

  INSTRUCTIONS:
  1. Go to your Supabase Dashboard
  2. Navigate to SQL Editor
  3. Copy and paste this entire SQL script
  4. Click "Run" to execute

  This will fix the issue where super_admin cannot create new users.
*/

-- Drop the existing policy that doesn't work properly for INSERT
DROP POLICY IF EXISTS "Super admins can manage all profiles" ON user_profiles;

-- Create separate INSERT policy for super admins
CREATE POLICY "Super admins can insert user profiles" ON user_profiles
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() AND up.role = 'super_admin' AND up.is_active = true
    )
  );

-- Create UPDATE policy for super admins
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

-- Create DELETE policy for super admins
CREATE POLICY "Super admins can delete user profiles" ON user_profiles
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() AND up.role = 'super_admin' AND up.is_active = true
    )
  );
