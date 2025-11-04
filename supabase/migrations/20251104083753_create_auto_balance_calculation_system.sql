/*
  # Auto Balance Calculation System

  1. Overview
    - Creates a system to automatically calculate and update account balances
    - Balances are calculated from income (received) and expenses (done)
    - Triggers ensure balances update automatically when transactions change

  2. Functions Created
    - `calculate_account_balance()` - Calculates balance for a specific account
    - `update_account_balances()` - Trigger function to update balances

  3. Triggers Created
    - Updates account balances when income is inserted/updated/deleted
    - Updates account balances when expenses are inserted/updated/deleted

  4. How It Works
    - For each account (by account_name):
      * Income: Add received_amount when status = 'Received'
      * Expenses: Subtract amount when payment_status = 'Done'
      * Result stored in accounts.balance (in account's currency)
      * Converted balance calculated using exchange rates
*/

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
  -- Calculate total received income for this account
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

  -- Calculate total paid expenses for this account
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

  -- Calculate net balance
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
  -- Get the user_id, account_name, and currency from the transaction
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

  -- Calculate new balance
  v_new_balance := calculate_account_balance(v_user_id, v_account_name, v_currency);

  -- Get exchange rate for conversion to PKR
  SELECT rate INTO v_exchange_rate
  FROM exchange_rates
  WHERE user_id = v_user_id AND currency = v_currency
  LIMIT 1;

  -- If no exchange rate found, use 1 (for PKR)
  IF v_exchange_rate IS NULL THEN
    v_exchange_rate := 1;
  END IF;

  -- Calculate converted balance (to PKR)
  v_converted_balance := v_new_balance * v_exchange_rate;

  -- Update the account balance
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
