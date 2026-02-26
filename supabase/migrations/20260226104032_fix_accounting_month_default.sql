/*
  # Fix Accounting Month Default Value
  
  1. Changes
    - Add a default value for accounting_month column
    - Default will be derived from the date column in YYYY-MM format
  
  2. Purpose
    - Allow income inserts without explicitly providing accounting_month
    - Automatically set accounting_month based on the income date
*/

-- Add a default value that uses the date column to generate YYYY-MM format
ALTER TABLE income 
ALTER COLUMN accounting_month SET DEFAULT TO_CHAR(CURRENT_DATE, 'YYYY-MM');

-- Update any existing NULL values (shouldn't be any, but just in case)
UPDATE income 
SET accounting_month = TO_CHAR(date, 'YYYY-MM')
WHERE accounting_month IS NULL OR accounting_month = '';
