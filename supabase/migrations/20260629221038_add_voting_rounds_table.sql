
-- Create voting_rounds table
CREATE TABLE IF NOT EXISTS voting_rounds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  start_date timestamptz NOT NULL DEFAULT now(),
  end_date timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  winner_topic_id uuid,
  created_at timestamptz DEFAULT now()
);

-- Add round_id and status columns to wishlist_topics if they don't exist
ALTER TABLE wishlist_topics
  ADD COLUMN IF NOT EXISTS round_id uuid REFERENCES voting_rounds(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS published_comic_id uuid;

-- Add check constraint for status if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'wishlist_topics_status_check'
  ) THEN
    ALTER TABLE wishlist_topics
      ADD CONSTRAINT wishlist_topics_status_check
      CHECK (status IN ('active', 'winner', 'archived', 'published'));
  END IF;
END $$;

-- Add foreign key from voting_rounds.winner_topic_id to wishlist_topics
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'voting_rounds_winner_topic_id_fkey'
  ) THEN
    ALTER TABLE voting_rounds
      ADD CONSTRAINT voting_rounds_winner_topic_id_fkey
      FOREIGN KEY (winner_topic_id) REFERENCES wishlist_topics(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add winning_topic_id to comics if it doesn't exist
ALTER TABLE comics
  ADD COLUMN IF NOT EXISTS winning_topic_id uuid REFERENCES wishlist_topics(id) ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE voting_rounds ENABLE ROW LEVEL SECURITY;

-- Public read
CREATE POLICY "voting_rounds_public_read"
  ON voting_rounds FOR SELECT
  TO public
  USING (true);

-- Admin full access (only if not already created by a previous migration)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'voting_rounds' AND policyname = 'voting_rounds_admin_access'
  ) THEN
    CREATE POLICY "voting_rounds_admin_access"
      ON voting_rounds FOR ALL
      TO authenticated
      USING ((auth.jwt() ->> 'email') = 'admin@sst.com')
      WITH CHECK ((auth.jwt() ->> 'email') = 'admin@sst.com');
  END IF;
END $$;
