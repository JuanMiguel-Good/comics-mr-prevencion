/*
  # Create wishlist_topics table

  1. New Tables
    - `wishlist_topics`
      - `id` (uuid, primary key)
      - `title` (text)
      - `description` (text, optional)
      - `created_by` (uuid, foreign key to users)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `wishlist_topics` table
    - Add policies for viewing, creating, and admin deletion
*/

CREATE TABLE IF NOT EXISTS wishlist_topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE wishlist_topics ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view wishlist topics" ON wishlist_topics;
DROP POLICY IF EXISTS "Authenticated users can create topics" ON wishlist_topics;
DROP POLICY IF EXISTS "Admins can delete any topic" ON wishlist_topics;

-- Create policies
CREATE POLICY "Anyone can view wishlist topics"
  ON wishlist_topics
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can create topics"
  ON wishlist_topics
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Admins can delete any topic"
  ON wishlist_topics
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (auth.users.raw_user_meta_data->>'role' = 'admin')
    )
  );