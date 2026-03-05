/*
  # Add Default Exchange Rates

  1. Changes
    - Create a function to insert default exchange rates for a user
    - Modify the handle_new_user function to automatically create default exchange rates
    - Add the following default rates:
      - AUD: 197.37
      - EUR: 325.29
      - CAD: 204.35
      - NZD: 165.63
      - SGD: 219.01
      - NOK: 28.95
      - WON: 0.19
      - USD: 280.00 (common default)
      - GBP: 350.00 (common default)
      - AED: 76.00 (common default)

  2. Security
    - Function runs with SECURITY DEFINER to bypass RLS
    - Only called automatically on user creation
*/

-- Function to create default exchange rates for a user
CREATE OR REPLACE FUNCTION create_default_exchange_rates(user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert default exchange rates
  INSERT INTO exchange_rates (user_id, currency, rate, updated_by)
  VALUES
    (user_id, 'PKR', 1, user_id),
    (user_id, 'USD', 280.00, user_id),
    (user_id, 'GBP', 350.00, user_id),
    (user_id, 'AED', 76.00, user_id),
    (user_id, 'AUD', 197.37, user_id),
    (user_id, 'EUR', 325.29, user_id),
    (user_id, 'CAD', 204.35, user_id),
    (user_id, 'NZD', 165.63, user_id),
    (user_id, 'SGD', 219.01, user_id),
    (user_id, 'NOK', 28.95, user_id),
    (user_id, 'WON', 0.19, user_id)
  ON CONFLICT (user_id, currency) DO NOTHING;
END;
$$;

-- Update the handle_new_user function to create default exchange rates
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
  SELECT COUNT(*) INTO user_count FROM user_profiles;

  IF user_count = 0 THEN
    user_role := 'super_admin';
  ELSE
    user_role := 'viewer';
  END IF;

  INSERT INTO public.user_profiles (id, email, name, role, permission_level, created_at, updated_at, last_login)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    user_role,
    CASE 
      WHEN user_role = 'super_admin' THEN 'full_access'
      ELSE 'view_only'
    END,
    NOW(),
    NOW(),
    NOW()
  );

  -- Create default exchange rates for the new user
  PERFORM create_default_exchange_rates(NEW.id);

  RETURN NEW;
END;
$$;
