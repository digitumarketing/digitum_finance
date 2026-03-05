/*
  # Add accounting_month field to expenses table
  
  1. Changes
    - Add `accounting_month` column to expenses table
    - Format: "MMMM YYYY" (e.g., "February 2026")
    - Creates index for better query performance
  
  2. Purpose
    - Allow expenses to be assigned to specific accounting periods
    - Separate transaction date from accounting period
    - Match income table structure for consistency
*/

-- Add accounting_month column to expenses table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'expenses' AND column_name = 'accounting_month'
  ) THEN
    ALTER TABLE expenses ADD COLUMN accounting_month text;
  END IF;
END $$;

-- Create index for accounting_month if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_expenses_accounting_month ON expenses(accounting_month);

-- Update existing records to have accounting_month based on their date
UPDATE expenses
SET accounting_month = TO_CHAR(date, 'Month YYYY')
WHERE accounting_month IS NULL;