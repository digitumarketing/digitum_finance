/*
  # Add Accounting Month Field to Income Table

  1. Changes
    - Add `accounting_month` column to income table
      - Format: YYYY-MM (e.g., '2024-01')
      - This field specifies which month/year the income should be counted toward for financial tracking
      - Defaults to the month of the income date
      - Useful when payment is received in one month but should count toward a different month
  
  2. Purpose
    - Allows tracking income in the correct accounting period
    - Example: Work done in January, payment received in February, but income should count toward January
    - Improves financial reporting accuracy
*/

-- Add accounting_month column to income table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'income' AND column_name = 'accounting_month'
  ) THEN
    ALTER TABLE income ADD COLUMN accounting_month text;
  END IF;
END $$;

-- Update existing records to set accounting_month based on their date
UPDATE income 
SET accounting_month = TO_CHAR(date, 'YYYY-MM')
WHERE accounting_month IS NULL;

-- Make the column NOT NULL after setting default values
ALTER TABLE income 
ALTER COLUMN accounting_month SET NOT NULL;

-- Add a check constraint to ensure proper format (YYYY-MM)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'income_accounting_month_format'
  ) THEN
    ALTER TABLE income 
    ADD CONSTRAINT income_accounting_month_format 
    CHECK (accounting_month ~ '^\d{4}-\d{2}$');
  END IF;
END $$;

-- Create an index for better query performance on accounting_month
CREATE INDEX IF NOT EXISTS idx_income_accounting_month ON income(accounting_month);
