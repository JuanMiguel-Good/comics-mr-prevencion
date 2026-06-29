/*
  # Add Winner Topic System

  1. New Columns
    - `comics.winning_topic_id` (uuid, nullable) - Links comic to winning topic
    - `wishlist_topics.published_comic_id` (uuid, nullable) - Links topic to published comic

  2. Security
    - Uses existing RLS policies (no new policies created)

  3. Notes
    - Simple column addition only
    - Foreign key constraints for data integrity
*/

-- Add winning_topic_id to comics table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'comics' AND column_name = 'winning_topic_id'
  ) THEN
    ALTER TABLE comics ADD COLUMN winning_topic_id uuid;
  END IF;
END $$;

-- Add published_comic_id to wishlist_topics table  
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'wishlist_topics' AND column_name = 'published_comic_id'
  ) THEN
    ALTER TABLE wishlist_topics ADD COLUMN published_comic_id uuid;
  END IF;
END $$;

-- Add foreign key constraint for comics.winning_topic_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'comics_winning_topic_id_fkey'
  ) THEN
    ALTER TABLE comics ADD CONSTRAINT comics_winning_topic_id_fkey 
    FOREIGN KEY (winning_topic_id) REFERENCES wishlist_topics(id);
  END IF;
END $$;

-- Add foreign key constraint for wishlist_topics.published_comic_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'wishlist_topics_published_comic_id_fkey'
  ) THEN
    ALTER TABLE wishlist_topics ADD CONSTRAINT wishlist_topics_published_comic_id_fkey 
    FOREIGN KEY (published_comic_id) REFERENCES comics(id);
  END IF;
END $$;

-- Add useful indexes
CREATE INDEX IF NOT EXISTS idx_comics_winning_topic_id ON comics(winning_topic_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_topics_published_comic_id ON wishlist_topics(published_comic_id);