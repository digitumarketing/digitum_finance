/*
  # Create insert_income function
  
  1. New Function
    - `insert_income` - Inserts income record and returns the created record
    - Bypasses REST API cache issues by using direct SQL
  
  2. Purpose
    - Temporary workaround for PostgREST cache not recognizing new columns
    - Ensures all income fields including accounting_month can be inserted
*/

CREATE OR REPLACE FUNCTION insert_income(
  p_user_id uuid,
  p_date date,
  p_original_amount numeric,
  p_currency text,
  p_received_amount numeric,
  p_converted_amount numeric,
  p_original_converted_amount numeric,
  p_category text,
  p_description text,
  p_client_name text,
  p_notes text,
  p_status text,
  p_account_name text,
  p_due_date date,
  p_accounting_month text,
  p_manual_conversion_rate numeric,
  p_manual_pkr_amount numeric,
  p_split_amount_pkr numeric,
  p_split_rate_used numeric
)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  date date,
  original_amount numeric,
  currency text,
  received_amount numeric,
  converted_amount numeric,
  original_converted_amount numeric,
  category text,
  description text,
  client_name text,
  notes text,
  status text,
  account_name text,
  due_date date,
  accounting_month text,
  manual_conversion_rate numeric,
  manual_pkr_amount numeric,
  split_amount_pkr numeric,
  split_rate_used numeric,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_income_id uuid;
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
    p_user_id,
    p_date,
    p_original_amount,
    p_currency,
    p_received_amount,
    p_converted_amount,
    p_original_converted_amount,
    p_category,
    p_description,
    p_client_name,
    p_notes,
    p_status,
    p_account_name,
    p_due_date,
    p_accounting_month,
    p_manual_conversion_rate,
    p_manual_pkr_amount,
    p_split_amount_pkr,
    p_split_rate_used
  )
  RETURNING income.id INTO v_income_id;
  
  RETURN QUERY
  SELECT 
    i.id,
    i.user_id,
    i.date,
    i.original_amount,
    i.currency,
    i.received_amount,
    i.converted_amount,
    i.original_converted_amount,
    i.category,
    i.description,
    i.client_name,
    i.notes,
    i.status,
    i.account_name,
    i.due_date,
    i.accounting_month,
    i.manual_conversion_rate,
    i.manual_pkr_amount,
    i.split_amount_pkr,
    i.split_rate_used,
    i.created_at,
    i.updated_at
  FROM income i
  WHERE i.id = v_income_id;
END;
$$;