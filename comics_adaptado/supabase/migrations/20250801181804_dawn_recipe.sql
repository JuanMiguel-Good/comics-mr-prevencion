/*
  # Create wishlist_topics table

  1. New Tables
    - `wishlist_topics`
      - `id` (uuid, primary key)
      - `title` (text, not null)
      - `description` (text, optional)
      - `created_by` (uuid, foreign key to auth.users)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `wishlist_topics` table
    - Add policy for public to read wishlist topics
    - Add policy for authenticated users to create topics
    - Add policy for admins to delete any topic
*/

CREATE TABLE IF NOT EXISTS wishlist_topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE wishlist_topics ENABLE ROW LEVEL SECURITY;

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
      AND (auth.users.raw_user_meta_data->>'role')::text = 'admin'
    )
  );