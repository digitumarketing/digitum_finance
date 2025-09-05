/*
  # Insert Super Admin Profile

  1. Purpose
    - Create user profile for existing Super Admin user
    - Set up initial accounts and exchange rates
    - Ensure proper data initialization

  2. User Setup
    - Email: chabdulrehman1039@gmail.com
    - ID: 1efa0f6d-4aa8-490c-a3fb-064e77b8d235
    - Role: super_admin with full_access
*/

-- Insert Super Admin profile
INSERT INTO user_profiles (
  id,
  email,
  name,
  role,
  permission_level,
  is_active,
  department,
  notes
) VALUES (
  '1efa0f6d-4aa8-490c-a3fb-064e77b8d235',
  'chabdulrehman1039@gmail.com',
  'Admin User',
  'super_admin',
  'full_access',
  true,
  'Administration',
  'Super Admin with full system control'
) ON CONFLICT (id) DO UPDATE SET
  role = 'super_admin',
  permission_level = 'full_access',
  is_active = true;

-- Insert default accounts for the super admin
INSERT INTO accounts (user_id, name, currency, balance, converted_balance) VALUES
  ('1efa0f6d-4aa8-490c-a3fb-064e77b8d235', 'Bank Alfalah', 'PKR', 0, 0),
  ('1efa0f6d-4aa8-490c-a3fb-064e77b8d235', 'Wise USD', 'USD', 0, 0),
  ('1efa0f6d-4aa8-490c-a3fb-064e77b8d235', 'Wise GBP', 'GBP', 0, 0),
  ('1efa0f6d-4aa8-490c-a3fb-064e77b8d235', 'Payoneer', 'USD', 0, 0)
ON CONFLICT DO NOTHING;

-- Insert default exchange rates
INSERT INTO exchange_rates (user_id, currency, rate, updated_by) VALUES
  ('1efa0f6d-4aa8-490c-a3fb-064e77b8d235', 'USD', 278.50, '1efa0f6d-4aa8-490c-a3fb-064e77b8d235'),
  ('1efa0f6d-4aa8-490c-a3fb-064e77b8d235', 'AED', 75.85, '1efa0f6d-4aa8-490c-a3fb-064e77b8d235'),
  ('1efa0f6d-4aa8-490c-a3fb-064e77b8d235', 'GBP', 354.20, '1efa0f6d-4aa8-490c-a3fb-064e77b8d235'),
  ('1efa0f6d-4aa8-490c-a3fb-064e77b8d235', 'PKR', 1, '1efa0f6d-4aa8-490c-a3fb-064e77b8d235')
ON CONFLICT (user_id, currency) DO UPDATE SET
  rate = EXCLUDED.rate,
  updated_by = EXCLUDED.updated_by;

-- Insert default notification settings
INSERT INTO notification_settings (
  user_id,
  email_enabled,
  whatsapp_enabled,
  in_app_enabled,
  reminder_days,
  daily_digest,
  weekly_report
) VALUES (
  '1efa0f6d-4aa8-490c-a3fb-064e77b8d235',
  false,
  false,
  true,
  3,
  false,
  false
) ON CONFLICT (user_id) DO NOTHING;