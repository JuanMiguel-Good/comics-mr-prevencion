/*
  # Add voting rounds system and topic status

  1. New Tables
    - `voting_rounds` - Manages biweekly voting periods
      - `id` (uuid, primary key)
      - `start_date` (timestamptz)
      - `end_date` (timestamptz) 
      - `status` (text) - 'active', 'completed', 'cancelled'
      - `winner_topic_id` (uuid, nullable)
      - `created_at` (timestamptz)

  2. Table Updates
    - Add `status` to `wishlist_topics` - 'active', 'winner', 'archived', 'completed'
    - Add `round_id` to `wishlist_topics` to track which round they belong to

  3. Security
    - Enable RLS on new table
    - Add appropriate policies
*/

-- Create voting_rounds table
CREATE TABLE IF NOT EXISTS voting_rounds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  winner_topic_id uuid,
  created_at timestamptz DEFAULT now()
);

-- Add new columns to wishlist_topics
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'wishlist_topics' AND column_name = 'status'
  ) THEN
    ALTER TABLE wishlist_topics ADD COLUMN status text DEFAULT 'active' CHECK (status IN ('active', 'winner', 'archived', 'completed'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'wishlist_topics' AND column_name = 'round_id'
  ) THEN
    ALTER TABLE wishlist_topics ADD COLUMN round_id uuid;
  END IF;
END $$;

-- Enable RLS on voting_rounds
ALTER TABLE voting_rounds ENABLE ROW LEVEL SECURITY;

-- Policies for voting_rounds
CREATE POLICY "Anyone can view voting rounds"
  ON voting_rounds
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Only admins can manage voting rounds"
  ON voting_rounds
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.email = 'admin@sst.com'
    )
  );

-- Add foreign key constraint
ALTER TABLE voting_rounds 
ADD CONSTRAINT voting_rounds_winner_topic_id_fkey 
FOREIGN KEY (winner_topic_id) REFERENCES wishlist_topics(id);

ALTER TABLE wishlist_topics 
ADD CONSTRAINT wishlist_topics_round_id_fkey 
FOREIGN KEY (round_id) REFERENCES voting_rounds(id);

-- Create initial active voting round (2 weeks from now)
INSERT INTO voting_rounds (start_date, end_date, status)
VALUES (
  now(),
  now() + interval '14 days',
  'active'
);

-- Update existing topics to be in the active round
UPDATE wishlist_topics 
SET round_id = (SELECT id FROM voting_rounds WHERE status = 'active' LIMIT 1)
WHERE round_id IS NULL;