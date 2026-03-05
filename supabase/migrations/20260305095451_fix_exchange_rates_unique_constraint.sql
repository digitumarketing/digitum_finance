/*
  # Fix Exchange Rates Unique Constraint

  1. Changes
    - Drop the incorrect UNIQUE constraint on currency alone
    - Add correct UNIQUE constraint on (user_id, currency) combination
    - This allows each user to have their own exchange rates

  2. Security
    - No changes to RLS policies
*/

-- Drop the incorrect unique constraint
ALTER TABLE exchange_rates DROP CONSTRAINT IF EXISTS exchange_rates_currency_key;

-- Add the correct unique constraint
ALTER TABLE exchange_rates ADD CONSTRAINT exchange_rates_user_id_currency_key UNIQUE (user_id, currency);
