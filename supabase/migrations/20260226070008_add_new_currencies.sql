/*
  # Add New Currency Support

  1. New Currencies Added
    - AUD (Australian Dollar) - Rate: 182.50 PKR
    - EUR (Euro) - Rate: 305.75 PKR
    - CAD (Canadian Dollar) - Rate: 202.30 PKR
    - NZD (New Zealand Dollar) - Rate: 168.40 PKR
    - SGD (Singapore Dollar) - Rate: 207.90 PKR
    - NOK (Norwegian Krone) - Rate: 26.35 PKR
    - KRW (South Korean Won) - Rate: 0.21 PKR (1000 KRW = 210 PKR)

  2. Changes
    - Add exchange rates for new currencies for existing users
    - Update auto-create profile trigger to include new currencies

  3. Notes
    - Rates are approximate and should be updated by users as needed
    - All existing users will get these new currency rates
    - New users will automatically get all currency rates
*/

-- Add new currency exchange rates for all existing users
DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN SELECT id FROM auth.users
  LOOP
    -- Insert new currencies if they don't exist
    INSERT INTO exchange_rates (user_id, currency, rate, updated_by)
    VALUES
      (user_record.id, 'AUD', 182.5000, user_record.id),
      (user_record.id, 'EUR', 305.7500, user_record.id),
      (user_record.id, 'CAD', 202.3000, user_record.id),
      (user_record.id, 'NZD', 168.4000, user_record.id),
      (user_record.id, 'SGD', 207.9000, user_record.id),
      (user_record.id, 'NOK', 26.3500, user_record.id),
      (user_record.id, 'KRW', 0.2100, user_record.id)
    ON CONFLICT (user_id, currency) DO NOTHING;
  END LOOP;
END $$;

-- Update the auto-create profile trigger to include new currencies
CREATE OR REPLACE FUNCTION auto_create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  -- Create profile
  INSERT INTO user_profiles (id, email, name, role, permission_level, is_active, last_login)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, 'unknown@email.com'),
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    'viewer',
    'view_only',
    true,
    now()
  );

  -- Create default accounts
  INSERT INTO accounts (user_id, name, currency, balance, converted_balance, notes)
  VALUES
    (NEW.id, 'Bank Alfalah', 'PKR', 0, 0, 'Primary PKR bank account'),
    (NEW.id, 'Wise USD', 'USD', 0, 0, 'USD foreign exchange account'),
    (NEW.id, 'Wise GBP', 'GBP', 0, 0, 'GBP foreign exchange account'),
    (NEW.id, 'Payoneer', 'USD', 0, 0, 'USD payment processing account');

  -- Create default exchange rates (including all currencies)
  INSERT INTO exchange_rates (user_id, currency, rate, updated_by)
  VALUES
    (NEW.id, 'USD', 278.5000, NEW.id),
    (NEW.id, 'AED', 75.8500, NEW.id),
    (NEW.id, 'GBP', 354.2000, NEW.id),
    (NEW.id, 'AUD', 182.5000, NEW.id),
    (NEW.id, 'EUR', 305.7500, NEW.id),
    (NEW.id, 'CAD', 202.3000, NEW.id),
    (NEW.id, 'NZD', 168.4000, NEW.id),
    (NEW.id, 'SGD', 207.9000, NEW.id),
    (NEW.id, 'NOK', 26.3500, NEW.id),
    (NEW.id, 'KRW', 0.2100, NEW.id);

  -- Create default notification settings
  INSERT INTO notification_settings (user_id, email_enabled, whatsapp_enabled, in_app_enabled, reminder_days, daily_digest, weekly_report)
  VALUES (NEW.id, true, false, true, 3, false, true);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
