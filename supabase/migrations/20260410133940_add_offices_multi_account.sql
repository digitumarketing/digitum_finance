/*
  # Multi-Account (Offices) Support

  ## Summary
  Adds a multi-account (offices/business units) system to the application.
  Each office is a fully isolated financial workspace with its own income,
  expenses, bank accounts, notifications, and exchange rates.

  ## New Tables
  - `offices` — Business units / offices owned by a user
    - `id` (uuid, primary key)
    - `name` (text) — Display name for the office
    - `description` (text) — Optional description
    - `color` (text) — UI accent color hex code
    - `user_id` (uuid) — Owner (references auth.users)
    - `is_default` (boolean) — Whether this is the user's default office
    - `created_at`, `updated_at` (timestamptz)

  ## Modified Tables
  All financial tables receive an `office_id` foreign key pointing to `offices`:
  - `income.office_id`
  - `expenses.office_id`
  - `accounts.office_id` (bank/cash accounts)
  - `notifications.office_id`
  - `exchange_rates.office_id`

  ## Data Migration
  1. Creates a "Main Office" default record for every existing user
  2. Backfills `office_id` on all existing records using the user's default office

  ## Constraint Changes
  - `exchange_rates`: drops `UNIQUE(user_id, currency)`, adds `UNIQUE(office_id, currency)`

  ## Security
  - RLS enabled on `offices` table
  - Policies ensure each user can only see and manage their own offices
  - Existing RLS on financial tables (user_id checks) remain intact; office_id
    filtering is enforced at the application layer
*/

-- ============================================================
-- 1. Create offices table
-- ============================================================

CREATE TABLE IF NOT EXISTS offices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  color text DEFAULT '#10b981',
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE offices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own offices"
  ON offices FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own offices"
  ON offices FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own offices"
  ON offices FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete own offices"
  ON offices FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE INDEX IF NOT EXISTS idx_offices_user_id ON offices(user_id);

-- Auto-update updated_at on offices
CREATE OR REPLACE FUNCTION update_offices_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_update_offices_updated_at ON offices;
CREATE TRIGGER trigger_update_offices_updated_at
  BEFORE UPDATE ON offices
  FOR EACH ROW EXECUTE FUNCTION update_offices_updated_at();

-- ============================================================
-- 2. Create default "Main Office" for every existing user
-- ============================================================

INSERT INTO offices (name, description, color, user_id, is_default)
SELECT
  'Main Office',
  'Default office',
  '#10b981',
  id,
  true
FROM auth.users
ON CONFLICT DO NOTHING;

-- ============================================================
-- 3. Add office_id to income
-- ============================================================

ALTER TABLE income ADD COLUMN IF NOT EXISTS office_id uuid REFERENCES offices(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_income_office_id ON income(office_id);

-- Backfill existing income records
UPDATE income i
SET office_id = o.id
FROM offices o
WHERE o.user_id = i.user_id
  AND o.is_default = true
  AND i.office_id IS NULL;

-- ============================================================
-- 4. Add office_id to expenses
-- ============================================================

ALTER TABLE expenses ADD COLUMN IF NOT EXISTS office_id uuid REFERENCES offices(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_expenses_office_id ON expenses(office_id);

-- Backfill existing expense records
UPDATE expenses e
SET office_id = o.id
FROM offices o
WHERE o.user_id = e.user_id
  AND o.is_default = true
  AND e.office_id IS NULL;

-- ============================================================
-- 5. Add office_id to accounts (bank/cash accounts)
-- ============================================================

ALTER TABLE accounts ADD COLUMN IF NOT EXISTS office_id uuid REFERENCES offices(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_accounts_office_id ON accounts(office_id);

-- Backfill existing account records
UPDATE accounts a
SET office_id = o.id
FROM offices o
WHERE o.user_id = a.user_id
  AND o.is_default = true
  AND a.office_id IS NULL;

-- ============================================================
-- 6. Add office_id to notifications
-- ============================================================

ALTER TABLE notifications ADD COLUMN IF NOT EXISTS office_id uuid REFERENCES offices(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_notifications_office_id ON notifications(office_id);

-- Backfill existing notification records
UPDATE notifications n
SET office_id = o.id
FROM offices o
WHERE o.user_id = n.user_id
  AND o.is_default = true
  AND n.office_id IS NULL;

-- ============================================================
-- 7. Add office_id to exchange_rates
--    Drop old UNIQUE(user_id, currency) and replace with UNIQUE(office_id, currency)
-- ============================================================

ALTER TABLE exchange_rates ADD COLUMN IF NOT EXISTS office_id uuid REFERENCES offices(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_exchange_rates_office_id ON exchange_rates(office_id);

-- Backfill existing exchange_rates records
UPDATE exchange_rates er
SET office_id = o.id
FROM offices o
WHERE o.user_id = er.user_id
  AND o.is_default = true
  AND er.office_id IS NULL;

-- Drop old unique constraint and add new one scoped to office
ALTER TABLE exchange_rates DROP CONSTRAINT IF EXISTS exchange_rates_user_id_currency_key;
ALTER TABLE exchange_rates DROP CONSTRAINT IF EXISTS exchange_rates_currency_key;
ALTER TABLE exchange_rates ADD CONSTRAINT exchange_rates_office_id_currency_key UNIQUE (office_id, currency);
