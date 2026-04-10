/*
  # Grant table access to PostgREST roles

  Ensures the authenticated and anon roles have the necessary
  schema and table grants for PostgREST to expose the offices table.
*/

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON TABLE offices TO authenticated;
GRANT SELECT ON TABLE offices TO anon;
