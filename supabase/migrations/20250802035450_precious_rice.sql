/*
  # Fix comics RLS policies

  1. Security Changes
    - Replace policies that query users table with JWT-based policies
    - Allow admin operations using auth.jwt() instead of users table joins
    - Maintain public read access for comics
*/

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Admin can manage comics" ON comics;
DROP POLICY IF EXISTS "Anyone can view comics" ON comics;
DROP POLICY IF EXISTS "Only admins can manage comics" ON comics;
DROP POLICY IF EXISTS "admin_manage_comics_final" ON comics;
DROP POLICY IF EXISTS "public_view_comics_final" ON comics;

-- Create new policies that don't access users table
CREATE POLICY "comics_admin_all"
  ON comics
  FOR ALL
  TO authenticated
  USING ((auth.jwt() ->> 'email'::text) = 'admin@sst.com'::text)
  WITH CHECK ((auth.jwt() ->> 'email'::text) = 'admin@sst.com'::text);

CREATE POLICY "comics_public_read"
  ON comics
  FOR SELECT
  TO public
  USING (true);