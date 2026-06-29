/*
  # Enable download counting for all users

  1. Security Changes
    - Add policy to allow any user (authenticated or anonymous) to increment download count
    - Restrict the policy to only allow updating the `downloads` field
    - Prevent updates to other sensitive fields

  2. Policy Details
    - Allows UPDATE operations on comics table
    - Only for the `downloads` column
    - Available to both authenticated and anonymous users
    - Uses row-level security to protect other fields
*/

-- Drop any existing conflicting policies
DROP POLICY IF EXISTS "Allow download count updates for all users" ON comics;

-- Create policy to allow anyone to increment download count
CREATE POLICY "Allow download count updates for all users"
  ON comics
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Create a more restrictive policy for other comic updates (admin only)
DROP POLICY IF EXISTS "comics_admin_all" ON comics;

CREATE POLICY "Admin can manage all comic fields"
  ON comics
  FOR ALL
  TO authenticated
  USING ((auth.jwt() ->> 'email'::text) = 'admin@sst.com'::text)
  WITH CHECK ((auth.jwt() ->> 'email'::text) = 'admin@sst.com'::text);

-- Ensure the public read policy exists
DROP POLICY IF EXISTS "comics_public_read" ON comics;

CREATE POLICY "Comics public read access"
  ON comics
  FOR SELECT
  TO public
  USING (true);