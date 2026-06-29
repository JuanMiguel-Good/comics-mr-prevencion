-- ==========================================
-- FIX RLS POLICIES - HANDLE EXISTING POLICIES
-- ==========================================

-- 1. FIX CATEGORIES POLICIES
DROP POLICY IF EXISTS "Anyone can view categories" ON categories;
DROP POLICY IF EXISTS "Only admins can manage categories" ON categories;

CREATE POLICY "Anyone can view categories"
  ON categories
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Only admins can manage categories"
  ON categories
  FOR ALL
  TO authenticated
  USING (auth.email() = 'admin@sst.com');

-- 2. FIX COMICS POLICIES
DROP POLICY IF EXISTS "Anyone can view comics" ON comics;
DROP POLICY IF EXISTS "Only admins can manage comics" ON comics;

CREATE POLICY "Anyone can view comics"
  ON comics
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Only admins can manage comics"
  ON comics
  FOR ALL
  TO authenticated
  USING (auth.email() = 'admin@sst.com');

-- 3. FIX COMIC_CATEGORIES POLICIES
DROP POLICY IF EXISTS "Anyone can view comic categories" ON comic_categories;
DROP POLICY IF EXISTS "Only admins can manage comic categories" ON comic_categories;

CREATE POLICY "Anyone can view comic categories"
  ON comic_categories
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Only admins can manage comic categories"
  ON comic_categories
  FOR ALL
  TO authenticated
  USING (auth.email() = 'admin@sst.com');

-- 4. FIX COMMENTS POLICIES
DROP POLICY IF EXISTS "Anyone can view comments" ON comments;
DROP POLICY IF EXISTS "Authenticated users can create comments" ON comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON comments;
DROP POLICY IF EXISTS "Users can delete their own comments or admins can delete any" ON comments;

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
  USING (auth.uid() = user_id OR auth.email() = 'admin@sst.com');

-- 5. FIX USER_RATINGS POLICIES
DROP POLICY IF EXISTS "Anyone can view ratings" ON user_ratings;
DROP POLICY IF EXISTS "Authenticated users can rate comics" ON user_ratings;
DROP POLICY IF EXISTS "Users can update their own ratings" ON user_ratings;

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

-- 6. FIX WISHLIST_TOPICS POLICIES
DROP POLICY IF EXISTS "Anyone can view wishlist topics" ON wishlist_topics;
DROP POLICY IF EXISTS "Authenticated users can create topics" ON wishlist_topics;
DROP POLICY IF EXISTS "Admins can delete any topic" ON wishlist_topics;

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
  USING (auth.email() = 'admin@sst.com');

-- 7. FIX WISHLIST_VOTES POLICIES
DROP POLICY IF EXISTS "Anyone can view wishlist votes" ON wishlist_votes;
DROP POLICY IF EXISTS "Authenticated users can vote" ON wishlist_votes;
DROP POLICY IF EXISTS "Users can delete their own votes" ON wishlist_votes;

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

-- 8. FIX STORAGE POLICIES (if they exist)
DROP POLICY IF EXISTS "Anyone can view comic files" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload files" ON storage.objects;

-- Create storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('comics', 'comics', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies
CREATE POLICY "Anyone can view comic files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'comics');

CREATE POLICY "Admins can upload files"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'comics' AND 
    auth.email() = 'admin@sst.com'
  );

-- ==========================================
-- POLICIES FIXED!
-- ==========================================