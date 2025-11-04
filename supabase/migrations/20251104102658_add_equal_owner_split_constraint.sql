/*
  # Add Equal Owner Split Constraint

  1. Overview
    - Ensures owner split is ALWAYS 50/50
    - Company gets X%, Owners get (100-X)%, split equally
    - Roshaan and Shahbaz percentages must always be equal

  2. Changes
    - Add constraint: roshaan_percentage = shahbaz_percentage
    - Update any existing data to ensure proper equal split
    - No changes to table structure
*/

-- Drop old constraint if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'equal_owner_split') THEN
    ALTER TABLE profit_distribution_settings DROP CONSTRAINT equal_owner_split;
  END IF;
END $$;

-- Ensure owner split is always 50/50
ALTER TABLE profit_distribution_settings
  ADD CONSTRAINT equal_owner_split CHECK (
    roshaan_percentage = shahbaz_percentage
  );

-- Update any existing data to ensure equal owner split
UPDATE profit_distribution_settings
SET 
  roshaan_percentage = (100 - company_percentage) / 2,
  shahbaz_percentage = (100 - company_percentage) / 2,
  updated_at = now()
WHERE roshaan_percentage != shahbaz_percentage;
