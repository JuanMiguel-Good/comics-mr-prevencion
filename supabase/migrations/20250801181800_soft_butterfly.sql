/*
  # Create user_ratings table

  1. New Tables
    - `user_ratings`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `comic_id` (uuid, foreign key to comics)
      - `rating` (integer, 1-5)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `user_ratings` table
    - Add policy for public to read ratings
    - Add policy for authenticated users to rate comics
    - Add policy for users to update their own ratings

  3. Constraints
    - Unique constraint on (user_id, comic_id)
    - Check constraint on rating (1-5)
*/

CREATE TABLE IF NOT EXISTS user_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  comic_id uuid REFERENCES comics(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, comic_id)
);

ALTER TABLE user_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view ratings"
  ON user_ratings
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can rate comics"
  ON user_ratings
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ratings"
  ON user_ratings
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);