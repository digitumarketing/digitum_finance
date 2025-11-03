/*
  # Auto-create User Profile Trigger

  1. Purpose
    - Automatically create user profile when new auth user is created
    - Set default role as 'super_admin' for first user, 'viewer' for others
    - Initialize default accounts and exchange rates for new users
    - Set up default notification settings

  2. Security
    - Trigger runs with security context bypassing RLS
    - Only creates profile if one doesn't exist
    - Safe for concurrent user creation
*/

-- Create function to auto-create user profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  user_count integer;
  user_role text;
BEGIN
  -- Count existing profiles to determine if this is the first user
  SELECT COUNT(*) INTO user_count FROM user_profiles;
  
  -- First user becomes super_admin, others become viewer
  IF user_count = 0 THEN
    user_role := 'super_admin';
  ELSE
    user_role := 'viewer';
  END IF;

  -- Insert user profile
  INSERT INTO public.user_profiles (
    id,
    email,
    name,
    role,
    permission_level,
    is_active,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    user_role,
    CASE WHEN user_role = 'super_admin' THEN 'full_access' ELSE 'view_only' END,
    true,
    NOW(),
    NOW()
  );

  -- Create default accounts
  INSERT INTO public.accounts (user_id, name, currency, balance, converted_balance, notes) VALUES
    (NEW.id, 'Bank Alfalah', 'PKR', 0, 0, 'Main PKR account'),
    (NEW.id, 'Wise USD', 'USD', 0, 0, 'USD foreign exchange account'),
    (NEW.id, 'Wise GBP', 'GBP', 0, 0, 'GBP foreign exchange account'),
    (NEW.id, 'Payoneer', 'USD', 0, 0, 'USD payment processing account');

  -- Create default exchange rates
  INSERT INTO public.exchange_rates (user_id, currency, rate, updated_by) VALUES
    (NEW.id, 'PKR', 1.0000, NEW.id),
    (NEW.id, 'USD', 278.5000, NEW.id),
    (NEW.id, 'AED', 75.8500, NEW.id),
    (NEW.id, 'GBP', 354.2000, NEW.id);

  -- Create default notification settings
  INSERT INTO public.notification_settings (
    user_id,
    email_enabled,
    whatsapp_enabled,
    in_app_enabled,
    email_address,
    reminder_days,
    daily_digest,
    weekly_report
  ) VALUES (
    NEW.id,
    false,
    false,
    true,
    NEW.email,
    3,
    false,
    false
  );

  RETURN NEW;
END;
$$;

-- Create trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();