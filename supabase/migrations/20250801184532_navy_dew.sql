-- ==========================================
-- FIX RLS POLICIES - REMOVE USERS TABLE ACCESS
-- ==========================================

-- Categories table policies - SIMPLIFIED
DROP POLICY IF EXISTS "Anyone can view categories" ON categories;
DROP POLICY IF EXISTS "Only admins can manage categories" ON categories;

CREATE POLICY "Anyone can view categories"
  ON categories
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Admin can manage categories"
  ON categories
  FOR ALL
  TO authenticated
  USING (auth.email() = 'admin@sst.com');

-- Comics table policies - SIMPLIFIED  
DROP POLICY IF EXISTS "Anyone can view comics" ON comics;
DROP POLICY IF EXISTS "Only admins can manage comics" ON comics;

CREATE POLICY "Anyone can view comics"
  ON comics
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Admin can manage comics"
  ON comics
  FOR ALL
  TO authenticated
  USING (auth.email() = 'admin@sst.com');

-- Comic categories table policies - SIMPLIFIED
DROP POLICY IF EXISTS "Anyone can view comic categories" ON comic_categories;
DROP POLICY IF EXISTS "Only admins can manage comic categories" ON comic_categories;

CREATE POLICY "Anyone can view comic categories"
  ON comic_categories
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Admin can manage comic categories"
  ON comic_categories
  FOR ALL
  TO authenticated
  USING (auth.email() = 'admin@sst.com');

-- Comments policies - KEEP EXISTING USER POLICIES
DROP POLICY IF EXISTS "Users can delete their own comments or admins can delete any" ON comments;

CREATE POLICY "Users can delete own comments or admin deletes any"
  ON comments
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id OR auth.email() = 'admin@sst.com');

-- Wishlist topics policies - SIMPLIFIED
DROP POLICY IF EXISTS "Admins can delete any topic" ON wishlist_topics;

CREATE POLICY "Admin can delete topics"
  ON wishlist_topics
  FOR DELETE
  TO authenticated
  USING (auth.email() = 'admin@sst.com');

-- ==========================================
-- POLICIES FIXED!
-- ==========================================