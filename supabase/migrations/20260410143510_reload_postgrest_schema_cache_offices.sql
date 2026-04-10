/*
  # Reload PostgREST schema cache

  Forces PostgREST to reload its schema cache so the `offices` table
  and all recently added columns (office_id) become accessible via the REST API.
*/

NOTIFY pgrst, 'reload schema';
