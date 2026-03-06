/*
  # Force schema reload for expenses table
  
  1. Purpose
    - Force PostgREST to reload its schema cache
    - Ensures the accounting_month column is recognized by the API
    
  2. Changes
    - Sends reload notification to PostgREST
    - Verifies accounting_month column exists
*/

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';

-- Verify the accounting_month column exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'expenses' 
      AND column_name = 'accounting_month'
  ) THEN
    RAISE EXCEPTION 'accounting_month column does not exist on expenses table';
  END IF;
END $$;
