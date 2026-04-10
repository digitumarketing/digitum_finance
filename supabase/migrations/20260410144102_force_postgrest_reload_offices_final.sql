/*
  # Force PostgREST schema cache reload (definitive)

  Sends two NOTIFY signals to ensure PostgREST picks up the offices table
  and all office_id foreign key columns added to financial tables.
*/

NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';
