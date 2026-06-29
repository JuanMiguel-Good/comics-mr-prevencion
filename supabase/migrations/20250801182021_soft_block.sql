/*
  # Create wishlist_votes table

  1. New Tables
    - `wishlist_votes`
      - `id` (uuid, primary key)
      - `topic_id` (uuid, foreign key to wishlist_topics)
      - `user_id` (uuid, foreign key to users)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `wishlist_votes` table
    - Add policies for viewing, voting, and removing votes
    - Users can only vote once per topic (unique constraint)
*/

CREATE TABLE IF NOT EXISTS wishlist_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id uuid REFERENCES wishlist_topics(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  UNIQUE(topic_id, user_id)
);

ALTER TABLE wishlist_votes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view wishlist votes" ON wishlist_votes;
DROP POLICY IF EXISTS "Authenticated users can vote" ON wishlist_votes;
DROP POLICY IF EXISTS "Users can delete their own votes" ON wishlist_votes;

-- Create policies
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