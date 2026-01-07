/*
  # Add function to recalculate all account balances

  1. New Function
    - `recalculate_all_account_balances()` - Recalculates balances for all accounts
    - Can be called manually to force a refresh of all account balances
    - Iterates through all accounts and recalculates based on transactions

  2. How It Works
    - Finds all unique accounts (by user_id, account name, and currency)
    - For each account, calculates balance from income (Received) and expenses (Done)
    - Updates the account balance and converted balance
    - Returns the number of accounts updated

  3. Usage
    - Call this function when you want to ensure all balances are accurate
    - Useful after bulk operations or data imports
    - Can be called from the frontend via RPC
*/

-- Function to recalculate all account balances
CREATE OR REPLACE FUNCTION recalculate_all_account_balances()
RETURNS integer AS $$
DECLARE
  v_account RECORD;
  v_new_balance numeric;
  v_exchange_rate numeric;
  v_converted_balance numeric;
  v_count integer := 0;
BEGIN
  -- Loop through all accounts
  FOR v_account IN
    SELECT id, user_id, name, currency
    FROM accounts
  LOOP
    -- Calculate new balance using the existing function
    v_new_balance := calculate_account_balance(
      v_account.user_id,
      v_account.name,
      v_account.currency
    );

    -- Get exchange rate for conversion to PKR
    SELECT rate INTO v_exchange_rate
    FROM exchange_rates
    WHERE user_id = v_account.user_id AND currency = v_account.currency
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
    WHERE id = v_account.id;

    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql;
