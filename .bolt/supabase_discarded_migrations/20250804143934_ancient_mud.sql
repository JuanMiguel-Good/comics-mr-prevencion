/*
  # Create voting system with rounds and topic status

  1. New Tables
    - `voting_rounds`
      - `id` (uuid, primary key)
      - `start_date` (timestamp)
      - `end_date` (timestamp) 
      - `status` (text: active, completed, cancelled)
      - `winner_topic_id` (uuid, nullable)
      - `created_at` (timestamp)

  2. Schema Changes
    - Add `status` column to `wishlist_topics` (active, winner, archived, completed)
    - Add `round_id` column to `wishlist_topics`

  3. Security
    - Enable RLS on `voting_rounds` table
    - Add policies for public read and admin management
    - Update existing policies as needed

  4. Data
    - Create initial active voting round (14 days from now)
    - Set all existing wishlist topics to 'active' status
*/

-- Create voting_rounds table
CREATE TABLE IF NOT EXISTS voting_rounds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  winner_topic_id uuid REFERENCES wishlist_topics(id),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on voting_rounds
ALTER TABLE voting_rounds ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for voting_rounds
CREATE POLICY "Anyone can view voting rounds"
  ON voting_rounds
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Only admins can manage voting rounds"
  ON voting_rounds
  FOR ALL
  TO authenticated
  USING ((jwt() ->> 'email'::text) = 'admin@sst.com'::text)
  WITH CHECK ((jwt() ->> 'email'::text) = 'admin@sst.com'::text);

-- Add status column to wishlist_topics if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'wishlist_topics' AND column_name = 'status'
  ) THEN
    ALTER TABLE wishlist_topics 
    ADD COLUMN status text NOT NULL DEFAULT 'active' 
    CHECK (status IN ('active', 'winner', 'archived', 'completed'));
  END IF;
END $$;

-- Add round_id column to wishlist_topics if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'wishlist_topics' AND column_name = 'round_id'
  ) THEN
    ALTER TABLE wishlist_topics 
    ADD COLUMN round_id uuid REFERENCES voting_rounds(id);
  END IF;
END $$;

-- Create initial active voting round (14 days duration)
INSERT INTO voting_rounds (start_date, end_date, status)
VALUES (
  now(),
  now() + interval '14 days',
  'active'
) ON CONFLICT DO NOTHING;

-- Update existing wishlist topics to be active and associate with current round
DO $$
DECLARE
  current_round_id uuid;
BEGIN
  -- Get the current active round ID
  SELECT id INTO current_round_id 
  FROM voting_rounds 
  WHERE status = 'active' 
  ORDER BY created_at DESC 
  LIMIT 1;
  
  -- Update existing topics if we have an active round
  IF current_round_id IS NOT NULL THEN
    UPDATE wishlist_topics 
    SET 
      status = 'active',
      round_id = current_round_id
    WHERE round_id IS NULL;
  END IF;
END $$;