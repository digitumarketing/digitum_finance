/*
  # Force PostgREST schema cache reload

  Sends a NOTIFY signal to reload the PostgREST schema cache so the
  'offices' table (and any recently added tables/columns) become
  accessible through the REST API.
*/

NOTIFY pgrst, 'reload schema';
