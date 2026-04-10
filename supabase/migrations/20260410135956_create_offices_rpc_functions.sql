/*
  # Create RPC functions for offices table

  Since PostgREST schema cache may not reflect the offices table immediately,
  these functions provide a reliable way to interact with the offices table
  via RPC calls which always work regardless of schema cache state.

  ## Functions
  - `get_my_offices()` — returns all offices for the current authenticated user
  - `create_my_office(name, description, color)` — creates a new office
  - `update_my_office(office_id, name, description, color)` — updates an office
  - `delete_my_office(office_id)` — deletes an office
  - `set_my_default_office(office_id)` — sets an office as default
*/

-- Get all offices for the current user
CREATE OR REPLACE FUNCTION get_my_offices()
RETURNS TABLE (
  id uuid,
  name text,
  description text,
  color text,
  is_default boolean,
  created_at timestamptz,
  updated_at timestamptz,
  user_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    o.id, o.name, o.description, o.color, o.is_default, o.created_at, o.updated_at, o.user_id
  FROM offices o
  WHERE o.user_id = auth.uid()
  ORDER BY o.created_at ASC;
END;
$$;

-- Create a new office for the current user
CREATE OR REPLACE FUNCTION create_my_office(
  p_name text,
  p_description text DEFAULT '',
  p_color text DEFAULT '#10b981'
)
RETURNS TABLE (
  id uuid,
  name text,
  description text,
  color text,
  is_default boolean,
  created_at timestamptz,
  updated_at timestamptz,
  user_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_id uuid;
BEGIN
  INSERT INTO offices (name, description, color, user_id, is_default)
  VALUES (p_name, p_description, p_color, auth.uid(), false)
  RETURNING offices.id INTO new_id;

  RETURN QUERY
  SELECT o.id, o.name, o.description, o.color, o.is_default, o.created_at, o.updated_at, o.user_id
  FROM offices o
  WHERE o.id = new_id;
END;
$$;

-- Update an existing office
CREATE OR REPLACE FUNCTION update_my_office(
  p_id uuid,
  p_name text DEFAULT NULL,
  p_description text DEFAULT NULL,
  p_color text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE offices
  SET
    name = COALESCE(p_name, name),
    description = COALESCE(p_description, description),
    color = COALESCE(p_color, color),
    updated_at = now()
  WHERE id = p_id AND user_id = auth.uid();
END;
$$;

-- Delete an office
CREATE OR REPLACE FUNCTION delete_my_office(p_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM offices
  WHERE id = p_id AND user_id = auth.uid();
END;
$$;

-- Set an office as the default
CREATE OR REPLACE FUNCTION set_my_default_office(p_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE offices SET is_default = false WHERE user_id = auth.uid();
  UPDATE offices SET is_default = true WHERE id = p_id AND user_id = auth.uid();
END;
$$;

-- Ensure a default office exists, creating one if not
CREATE OR REPLACE FUNCTION ensure_my_default_office()
RETURNS TABLE (
  id uuid,
  name text,
  description text,
  color text,
  is_default boolean,
  created_at timestamptz,
  updated_at timestamptz,
  user_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  existing_id uuid;
  new_id uuid;
BEGIN
  SELECT o.id INTO existing_id FROM offices o WHERE o.user_id = auth.uid() LIMIT 1;

  IF existing_id IS NOT NULL THEN
    RETURN QUERY
    SELECT o.id, o.name, o.description, o.color, o.is_default, o.created_at, o.updated_at, o.user_id
    FROM offices o WHERE o.user_id = auth.uid() ORDER BY o.created_at ASC;
  ELSE
    INSERT INTO offices (name, description, color, user_id, is_default)
    VALUES ('Main Office', 'Default office', '#10b981', auth.uid(), true)
    RETURNING offices.id INTO new_id;

    RETURN QUERY
    SELECT o.id, o.name, o.description, o.color, o.is_default, o.created_at, o.updated_at, o.user_id
    FROM offices o WHERE o.id = new_id;
  END IF;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_my_offices() TO authenticated;
GRANT EXECUTE ON FUNCTION create_my_office(text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION update_my_office(uuid, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_my_office(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION set_my_default_office(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION ensure_my_default_office() TO authenticated;
