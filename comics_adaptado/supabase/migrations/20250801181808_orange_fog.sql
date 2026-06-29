/*
  # Create wishlist_votes table

  1. New Tables
    - `wishlist_votes`
      - `id` (uuid, primary key)
      - `topic_id` (uuid, foreign key to wishlist_topics)
      - `user_id` (uuid, foreign key to auth.users)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `wishlist_votes` table
    - Add policy for public to read wishlist votes
    - Add policy for authenticated users to vote
    - Add policy for users to delete their own votes

  3. Constraints
    - Unique constraint on (topic_id, user_id)
*/

CREATE TABLE IF NOT EXISTS wishlist_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id uuid REFERENCES wishlist_topics(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  UNIQUE(topic_id, user_id)
);

ALTER TABLE wishlist_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view wishlist votes"
  ON wishlist_votes
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can vote"
  ON wishlist_votes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own votes"
  ON wishlist_votes
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);