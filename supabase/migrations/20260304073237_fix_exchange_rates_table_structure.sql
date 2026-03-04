/*
  # Fix Exchange Rates Table Structure for Shared Access

  1. Changes
    - Drop UNIQUE(user_id, currency) constraint
    - Add UNIQUE(currency) constraint
    - This makes exchange rates company-wide (one rate per currency)
    - user_id still tracks who created the rate (for audit)
    - updated_by tracks who last modified it

  2. Rationale
    - Exchange rates should be shared across all users
    - Only one rate per currency should exist
    - All users can view and update the shared rates
    - Audit trail maintained via user_id and updated_by

  3. Security
    - RLS policies already configured to allow all authenticated users to manage rates
    - This change aligns the table structure with the intended usage
*/

-- Drop the old unique constraint that included user_id
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'exchange_rates_user_id_currency_key'
    AND table_name = 'exchange_rates'
  ) THEN
    ALTER TABLE exchange_rates DROP CONSTRAINT exchange_rates_user_id_currency_key;
  END IF;
END $$;

-- Add new unique constraint on currency only
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'exchange_rates_currency_key'
    AND table_name = 'exchange_rates'
  ) THEN
    ALTER TABLE exchange_rates ADD CONSTRAINT exchange_rates_currency_key UNIQUE (currency);
  END IF;
END $$;
