/*
  # Fix Categories RLS Policies

  1. Problem
    - Current policies try to access `auth.users` table which is not accessible from public schema
    - This causes "permission denied for table users" errors

  2. Solution
    - Make categories publicly readable (SELECT)
    - Use auth.jwt() for admin operations instead of auth.users table
    - Simplify admin check to use JWT claims or user metadata

  3. Changes
    - Drop problematic policies
    - Create new policies that don't access auth.users table
    - Allow public read access to categories
    - Allow admin operations using JWT claims
*/

-- Drop existing problematic policies
DROP POLICY IF EXISTS "admin_manage_categories_final" ON categories;
DROP POLICY IF EXISTS "public_view_categories_final" ON categories;

-- Create new working policies
CREATE POLICY "categories_public_read" ON categories
  FOR SELECT TO public
  USING (true);

CREATE POLICY "categories_admin_all" ON categories
  FOR ALL TO authenticated
  USING (
    (auth.jwt() ->> 'email')::text = 'admin@sst.com'
  )
  WITH CHECK (
    (auth.jwt() ->> 'email')::text = 'admin@sst.com'
  );