/*
  # Create comic_categories junction table

  1. New Tables
    - `comic_categories`
      - `id` (uuid, primary key)
      - `comic_id` (uuid, foreign key to comics)
      - `category_id` (uuid, foreign key to categories)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `comic_categories` table
    - Add policies for public viewing and admin management

  3. Relationships
    - Foreign key to comics table with CASCADE delete
    - Foreign key to categories table with CASCADE delete
    - Unique constraint on comic_id + category_id combination
*/

CREATE TABLE IF NOT EXISTS comic_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comic_id uuid REFERENCES comics(id) ON DELETE CASCADE,
  category_id uuid REFERENCES categories(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(comic_id, category_id)
);

ALTER TABLE comic_categories ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view comic categories" ON comic_categories;
DROP POLICY IF EXISTS "Only admins can manage comic categories" ON comic_categories;

-- Create policies
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
      AND (auth.users.raw_user_meta_data->>'role' = 'admin')
    )
  );