/*
  # Create comments table

  1. New Tables
    - `comments`
      - `id` (uuid, primary key)
      - `comic_id` (uuid, foreign key to comics)
      - `user_id` (uuid, foreign key to auth.users)
      - `content` (text, not null)
      - `comment_type` (text, default 'opinion')
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `comments` table
    - Add policy for public to read comments
    - Add policy for authenticated users to create comments
    - Add policy for users to update/delete their own comments
    - Add policy for admins to delete any comment

  3. Constraints
    - Check constraint on comment_type (opinion, suggestion)
*/

CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comic_id uuid REFERENCES comics(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  content text NOT NULL,
  comment_type text DEFAULT 'opinion' CHECK (comment_type IN ('opinion', 'suggestion')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view comments"
  ON comments
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can create comments"
  ON comments
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments"
  ON comments
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments or admins can delete any"
  ON comments
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid() 
      AND (auth.users.raw_user_meta_data->>'role')::text = 'admin'
    )
  );