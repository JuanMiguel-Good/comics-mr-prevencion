/*
  # Fix comic_categories RLS policies

  1. Security Updates
    - Remove policies that access auth.users table
    - Add new policies using JWT claims
    - Allow public read access for categories
    - Allow admin write access using email from JWT

  2. Changes
    - Drop existing problematic policies
    - Create new policies that don't access users table
    - Use auth.jwt() for admin email verification
*/

-- Drop existing problematic policies
DROP POLICY IF EXISTS "admin_manage_comic_categories_2024" ON comic_categories;
DROP POLICY IF EXISTS "admin_manage_comic_categories_final" ON comic_categories;
DROP POLICY IF EXISTS "manage_comic_categories" ON comic_categories;
DROP POLICY IF EXISTS "public_view_comic_categories_2024" ON comic_categories;
DROP POLICY IF EXISTS "public_view_comic_categories_final" ON comic_categories;
DROP POLICY IF EXISTS "view_comic_categories" ON comic_categories;

-- Create new policies using JWT claims
CREATE POLICY "comic_categories_admin_all"
  ON comic_categories
  FOR ALL
  TO authenticated
  USING ((auth.jwt() ->> 'email') = 'admin@sst.com')
  WITH CHECK ((auth.jwt() ->> 'email') = 'admin@sst.com');

CREATE POLICY "comic_categories_public_read"
  ON comic_categories
  FOR SELECT
  TO public
  USING (true);