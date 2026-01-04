-- ========================================
-- Complete Database Setup for Digitum Finance
-- ========================================
-- Run this entire script in your Supabase SQL Editor
-- Dashboard -> SQL Editor -> New Query -> Paste and Run
-- ========================================

-- ========================================
-- PART 1: Create Tables
-- ========================================

-- Create user profiles table (extends Supabase Auth)
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  name text NOT NULL,
  role text NOT NULL DEFAULT 'viewer' CHECK (role IN ('super_admin', 'admin', 'manager', 'viewer')),
  permission_level text NOT NULL DEFAULT 'view_only' CHECK (permission_level IN ('view_only', 'view_edit', 'full_access')),
  is_active boolean DEFAULT true,
  phone text,
  department text,
  notes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_login timestamptz
);

-- Create accounts table
CREATE TABLE IF NOT EXISTS accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  currency text NOT NULL DEFAULT 'PKR',
  balance numeric(15,2) DEFAULT 0,
  converted_balance numeric(15,2) DEFAULT 0,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create exchange rates table
CREATE TABLE IF NOT EXISTS exchange_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  currency text NOT NULL,
  rate numeric(15,4) NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id),
  UNIQUE(user_id, currency)
);

-- Create income table
CREATE TABLE IF NOT EXISTS income (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL,
  original_amount numeric(15,2) NOT NULL,
  currency text NOT NULL DEFAULT 'PKR',
  received_amount numeric(15,2) DEFAULT 0,
  converted_amount numeric(15,2) DEFAULT 0,
  original_converted_amount numeric(15,2) DEFAULT 0,
  category text NOT NULL,
  description text NOT NULL,
  client_name text NOT NULL,
  notes text,
  status text NOT NULL DEFAULT 'Upcoming' CHECK (status IN ('Received', 'Upcoming', 'Partial', 'Cancelled')),
  account_name text NOT NULL,
  due_date date,
  manual_conversion_rate numeric(15,4),
  manual_pkr_amount numeric(15,2),
  split_amount_pkr numeric(15,2) DEFAULT 0,
  split_rate_used numeric(15,4) DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create expenses table
CREATE TABLE IF NOT EXISTS expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL,
  amount numeric(15,2) NOT NULL,
  currency text NOT NULL DEFAULT 'PKR',
  converted_amount numeric(15,2) DEFAULT 0,
  category text NOT NULL,
  description text NOT NULL,
  payment_status text NOT NULL DEFAULT 'Pending' CHECK (payment_status IN ('Pending', 'Done')),
  notes text,
  account_name text NOT NULL,
  due_date date,
  manual_conversion_rate numeric(15,4),
  manual_pkr_amount numeric(15,2),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  is_read boolean DEFAULT false,
  scheduled_for timestamptz,
  related_id uuid,
  channels jsonb DEFAULT '[]'::jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create notification settings table
CREATE TABLE IF NOT EXISTS notification_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  email_enabled boolean DEFAULT false,
  whatsapp_enabled boolean DEFAULT false,
  in_app_enabled boolean DEFAULT true,
  email_address text,
  whatsapp_number text,
  reminder_days integer DEFAULT 3,
  daily_digest boolean DEFAULT false,
  weekly_report boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ========================================
-- PART 2: Create Indexes
-- ========================================

CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_income_user_id ON income(user_id);
CREATE INDEX IF NOT EXISTS idx_income_date ON income(date);
CREATE INDEX IF NOT EXISTS idx_income_status ON income(status);
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
CREATE INDEX IF NOT EXISTS idx_expenses_status ON expenses(payment_status);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_priority ON notifications(priority);

-- ========================================
-- PART 3: Enable Row Level Security
-- ========================================

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE exchange_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE income ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;

-- ========================================
-- PART 4: Create RLS Policies
-- ========================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles;
DROP POLICY IF EXISTS "Super admins can read all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Super admins can manage all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Allow authenticated users to read profiles" ON user_profiles;
DROP POLICY IF EXISTS "Allow authenticated users to insert profiles" ON user_profiles;
DROP POLICY IF EXISTS "Allow authenticated users to update profiles" ON user_profiles;
DROP POLICY IF EXISTS "Allow authenticated users to delete profiles" ON user_profiles;

-- User profiles policies (non-recursive)
CREATE POLICY "Users can read own profile"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Allow authenticated users to read profiles"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert profiles"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update profiles"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete profiles"
  ON user_profiles
  FOR DELETE
  TO authenticated
  USING (true);

-- Accounts policies
CREATE POLICY "Users can manage own accounts" ON accounts
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Exchange rates policies
CREATE POLICY "Users can manage own exchange rates" ON exchange_rates
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Income policies
CREATE POLICY "Users can manage own income" ON income
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Expenses policies
CREATE POLICY "Users can manage own expenses" ON expenses
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Notifications policies
CREATE POLICY "Users can manage own notifications" ON notifications
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Notification settings policies
CREATE POLICY "Users can manage own notification settings" ON notification_settings
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ========================================
-- PART 5: Create Functions and Triggers
-- ========================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_accounts_updated_at ON accounts;
CREATE TRIGGER update_accounts_updated_at
  BEFORE UPDATE ON accounts
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_exchange_rates_updated_at ON exchange_rates;
CREATE TRIGGER update_exchange_rates_updated_at
  BEFORE UPDATE ON exchange_rates
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_income_updated_at ON income;
CREATE TRIGGER update_income_updated_at
  BEFORE UPDATE ON income
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_expenses_updated_at ON expenses;
CREATE TRIGGER update_expenses_updated_at
  BEFORE UPDATE ON expenses
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_notification_settings_updated_at ON notification_settings;
CREATE TRIGGER update_notification_settings_updated_at
  BEFORE UPDATE ON notification_settings
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ========================================
-- PART 6: Auto-create User Profile Trigger
-- ========================================

-- Function to auto-create user profile when user signs up
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

  INSERT INTO public.user_profiles (
    id,
    email,
    name,
    role,
    permission_level,
    is_active,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    user_role,
    CASE WHEN user_role = 'super_admin' THEN 'full_access' ELSE 'view_only' END,
    true,
    NOW(),
    NOW()
  );

  INSERT INTO public.accounts (user_id, name, currency, balance, converted_balance, notes) VALUES
    (NEW.id, 'Bank Alfalah', 'PKR', 0, 0, 'Main PKR account'),
    (NEW.id, 'Wise USD', 'USD', 0, 0, 'USD foreign exchange account'),
    (NEW.id, 'Wise GBP', 'GBP', 0, 0, 'GBP foreign exchange account'),
    (NEW.id, 'Payoneer', 'USD', 0, 0, 'USD payment processing account');

  INSERT INTO public.exchange_rates (user_id, currency, rate, updated_by) VALUES
    (NEW.id, 'PKR', 1.0000, NEW.id),
    (NEW.id, 'USD', 278.5000, NEW.id),
    (NEW.id, 'AED', 75.8500, NEW.id),
    (NEW.id, 'GBP', 354.2000, NEW.id);

  INSERT INTO public.notification_settings (
    user_id,
    email_enabled,
    whatsapp_enabled,
    in_app_enabled,
    email_address,
    reminder_days,
    daily_digest,
    weekly_report
  ) VALUES (
    NEW.id,
    false,
    false,
    true,
    NEW.email,
    3,
    false,
    false
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ========================================
-- PART 7: Auto Balance Calculation System
-- ========================================

-- Function to calculate balance for a specific account
CREATE OR REPLACE FUNCTION calculate_account_balance(
  p_user_id uuid,
  p_account_name text,
  p_currency text
)
RETURNS numeric AS $$
DECLARE
  v_total_income numeric := 0;
  v_total_expenses numeric := 0;
  v_balance numeric := 0;
BEGIN
  SELECT COALESCE(SUM(
    CASE
      WHEN status = 'Received' THEN received_amount
      ELSE 0
    END
  ), 0)
  INTO v_total_income
  FROM income
  WHERE user_id = p_user_id
    AND account_name = p_account_name
    AND currency = p_currency;

  SELECT COALESCE(SUM(
    CASE
      WHEN payment_status = 'Done' THEN amount
      ELSE 0
    END
  ), 0)
  INTO v_total_expenses
  FROM expenses
  WHERE user_id = p_user_id
    AND account_name = p_account_name
    AND currency = p_currency;

  v_balance := v_total_income - v_total_expenses;

  RETURN v_balance;
END;
$$ LANGUAGE plpgsql;

-- Function to update account balance (called by triggers)
CREATE OR REPLACE FUNCTION update_account_balances()
RETURNS trigger AS $$
DECLARE
  v_user_id uuid;
  v_account_name text;
  v_currency text;
  v_new_balance numeric;
  v_exchange_rate numeric;
  v_converted_balance numeric;
BEGIN
  IF TG_TABLE_NAME = 'income' THEN
    IF TG_OP = 'DELETE' THEN
      v_user_id := OLD.user_id;
      v_account_name := OLD.account_name;
      v_currency := OLD.currency;
    ELSE
      v_user_id := NEW.user_id;
      v_account_name := NEW.account_name;
      v_currency := NEW.currency;
    END IF;
  ELSIF TG_TABLE_NAME = 'expenses' THEN
    IF TG_OP = 'DELETE' THEN
      v_user_id := OLD.user_id;
      v_account_name := OLD.account_name;
      v_currency := OLD.currency;
    ELSE
      v_user_id := NEW.user_id;
      v_account_name := NEW.account_name;
      v_currency := NEW.currency;
    END IF;
  END IF;

  v_new_balance := calculate_account_balance(v_user_id, v_account_name, v_currency);

  SELECT rate INTO v_exchange_rate
  FROM exchange_rates
  WHERE user_id = v_user_id AND currency = v_currency
  LIMIT 1;

  IF v_exchange_rate IS NULL THEN
    v_exchange_rate := 1;
  END IF;

  v_converted_balance := v_new_balance * v_exchange_rate;

  UPDATE accounts
  SET
    balance = v_new_balance,
    converted_balance = v_converted_balance,
    updated_at = now()
  WHERE user_id = v_user_id
    AND name = v_account_name
    AND currency = v_currency;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers for income table
DROP TRIGGER IF EXISTS trigger_update_balance_on_income_insert ON income;
CREATE TRIGGER trigger_update_balance_on_income_insert
  AFTER INSERT ON income
  FOR EACH ROW
  EXECUTE FUNCTION update_account_balances();

DROP TRIGGER IF EXISTS trigger_update_balance_on_income_update ON income;
CREATE TRIGGER trigger_update_balance_on_income_update
  AFTER UPDATE ON income
  FOR EACH ROW
  EXECUTE FUNCTION update_account_balances();

DROP TRIGGER IF EXISTS trigger_update_balance_on_income_delete ON income;
CREATE TRIGGER trigger_update_balance_on_income_delete
  AFTER DELETE ON income
  FOR EACH ROW
  EXECUTE FUNCTION update_account_balances();

-- Create triggers for expenses table
DROP TRIGGER IF EXISTS trigger_update_balance_on_expense_insert ON expenses;
CREATE TRIGGER trigger_update_balance_on_expense_insert
  AFTER INSERT ON expenses
  FOR EACH ROW
  EXECUTE FUNCTION update_account_balances();

DROP TRIGGER IF EXISTS trigger_update_balance_on_expense_update ON expenses;
CREATE TRIGGER trigger_update_balance_on_expense_update
  AFTER UPDATE ON expenses
  FOR EACH ROW
  EXECUTE FUNCTION update_account_balances();

DROP TRIGGER IF EXISTS trigger_update_balance_on_expense_delete ON expenses;
CREATE TRIGGER trigger_update_balance_on_expense_delete
  AFTER DELETE ON expenses
  FOR EACH ROW
  EXECUTE FUNCTION update_account_balances();

-- ========================================
-- SETUP COMPLETE!
-- ========================================
-- Your database is now ready to use.
-- The first user to sign up will automatically become the super admin.
-- ========================================