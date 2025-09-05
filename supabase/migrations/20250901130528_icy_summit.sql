/*
  # Create Super Admin User Profile

  1. New Data
    - Insert user profile for the existing Supabase Auth user
    - Set role as 'super_admin' with 'full_access' permissions
    - Create default accounts for the user
    - Set up default exchange rates
    - Configure default notification settings

  2. User Details
    - Email: chabdulrehman1039@gmail.com
    - ID: 1efa0f6d-4aa8-490c-a3fb-064e77b8d235
    - Role: Super Admin
    - Full system access
*/

-- Insert the super admin user profile
INSERT INTO user_profiles (
  id,
  email,
  name,
  role,
  permission_level,
  is_active,
  department,
  notes,
  created_at,
  last_login
) VALUES (
  '1efa0f6d-4aa8-490c-a3fb-064e77b8d235',
  'chabdulrehman1039@gmail.com',
  'Roshaan',
  'super_admin',
  'full_access',
  true,
  'Management',
  'Super Admin with full system control',
  now(),
  now()
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  permission_level = EXCLUDED.permission_level,
  is_active = EXCLUDED.is_active,
  department = EXCLUDED.department,
  notes = EXCLUDED.notes,
  last_login = EXCLUDED.last_login;

-- Insert default accounts
INSERT INTO accounts (user_id, name, currency, balance, converted_balance, notes) VALUES
  ('1efa0f6d-4aa8-490c-a3fb-064e77b8d235', 'Bank Alfalah', 'PKR', 0, 0, 'Main PKR account'),
  ('1efa0f6d-4aa8-490c-a3fb-064e77b8d235', 'Wise USD', 'USD', 0, 0, 'USD foreign exchange account'),
  ('1efa0f6d-4aa8-490c-a3fb-064e77b8d235', 'Wise GBP', 'GBP', 0, 0, 'GBP foreign exchange account'),
  ('1efa0f6d-4aa8-490c-a3fb-064e77b8d235', 'Payoneer', 'USD', 0, 0, 'USD payment processing account')
ON CONFLICT DO NOTHING;

-- Insert default exchange rates
INSERT INTO exchange_rates (user_id, currency, rate, updated_by) VALUES
  ('1efa0f6d-4aa8-490c-a3fb-064e77b8d235', 'PKR', 1.0000, '1efa0f6d-4aa8-490c-a3fb-064e77b8d235'),
  ('1efa0f6d-4aa8-490c-a3fb-064e77b8d235', 'USD', 278.5000, '1efa0f6d-4aa8-490c-a3fb-064e77b8d235'),
  ('1efa0f6d-4aa8-490c-a3fb-064e77b8d235', 'AED', 75.8500, '1efa0f6d-4aa8-490c-a3fb-064e77b8d235'),
  ('1efa0f6d-4aa8-490c-a3fb-064e77b8d235', 'GBP', 354.2000, '1efa0f6d-4aa8-490c-a3fb-064e77b8d235')
ON CONFLICT (user_id, currency) DO UPDATE SET
  rate = EXCLUDED.rate,
  updated_by = EXCLUDED.updated_by,
  updated_at = now();

-- Insert default notification settings
INSERT INTO notification_settings (
  user_id,
  email_enabled,
  whatsapp_enabled,
  in_app_enabled,
  email_address,
  reminder_days,
  daily_digest,
  weekly_report
) VALUES (
  '1efa0f6d-4aa8-490c-a3fb-064e77b8d235',
  false,
  false,
  true,
  'chabdulrehman1039@gmail.com',
  3,
  false,
  false
) ON CONFLICT (user_id) DO UPDATE SET
  email_address = EXCLUDED.email_address,
  updated_at = now();