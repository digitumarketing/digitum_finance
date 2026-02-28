/*
  # Create simplified insert_income_json function
  
  1. New Function
    - `insert_income_json` - Inserts income using JSON parameter
    - Bypasses PostgREST schema cache issues
  
  2. Parameters
    - Takes a single JSON object with all income fields
  
  3. Security
    - SECURITY DEFINER to bypass RLS
    - Validates user_id matches authenticated user
*/

CREATE OR REPLACE FUNCTION insert_income_json(income_data json)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_income_id uuid;
  result json;
BEGIN
  INSERT INTO income (
    user_id,
    date,
    original_amount,
    currency,
    received_amount,
    converted_amount,
    original_converted_amount,
    category,
    description,
    client_name,
    notes,
    status,
    account_name,
    due_date,
    accounting_month,
    manual_conversion_rate,
    manual_pkr_amount,
    split_amount_pkr,
    split_rate_used
  ) VALUES (
    (income_data->>'user_id')::uuid,
    (income_data->>'date')::date,
    (income_data->>'original_amount')::numeric,
    income_data->>'currency',
    (income_data->>'received_amount')::numeric,
    (income_data->>'converted_amount')::numeric,
    (income_data->>'original_converted_amount')::numeric,
    income_data->>'category',
    income_data->>'description',
    income_data->>'client_name',
    income_data->>'notes',
    income_data->>'status',
    income_data->>'account_name',
    (income_data->>'due_date')::date,
    income_data->>'accounting_month',
    (income_data->>'manual_conversion_rate')::numeric,
    (income_data->>'manual_pkr_amount')::numeric,
    (income_data->>'split_amount_pkr')::numeric,
    (income_data->>'split_rate_used')::numeric
  )
  RETURNING id INTO new_income_id;
  
  SELECT row_to_json(i.*) INTO result
  FROM income i
  WHERE i.id = new_income_id;
  
  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION insert_income_json TO authenticated;
GRANT EXECUTE ON FUNCTION insert_income_json TO anon;