/*
  # Fix policy conflicts

  1. Security
    - Clean up duplicate policies that are causing conflicts
    - Ensure all policies exist without errors
    
  2. Changes
    - Drop and recreate policies safely
    - Use IF EXISTS to avoid conflicts
*/

-- Clean up any potential policy conflicts for comic_categories
DROP POLICY IF EXISTS "Anyone can view comic categories" ON comic_categories;
DROP POLICY IF EXISTS "Only admins can manage comic categories" ON comic_categories;

-- Recreate policies safely
CREATE POLICY "Anyone can view comic categories"
  ON comic_categories
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Only admins can manage comic categories"
  ON comic_categories
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND (auth.users.raw_user_meta_data ->> 'role') = 'admin'
    )
  );

-- Ensure RLS is enabled
ALTER TABLE comic_categories ENABLE ROW LEVEL SECURITY;