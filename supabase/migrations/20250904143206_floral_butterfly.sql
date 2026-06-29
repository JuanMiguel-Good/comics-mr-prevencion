/*
  # Fix JWT function errors in RLS policies

  1. Security Fixes
    - Replace `jwt()` with `auth.jwt()`
    - Replace `uid()` with `auth.uid()`
    - Replace `email()` with proper JWT email extraction
    - Fix all RLS policies to use correct Supabase auth functions

  2. Policy Updates
    - Update all tables with JWT-based policies
    - Ensure consistent policy naming and structure
    - Maintain security while fixing function calls
*/

-- Drop existing policies that use incorrect functions
DROP POLICY IF EXISTS "comic_categories_admin_all" ON comic_categories;
DROP POLICY IF EXISTS "Admin can manage all comic fields" ON comics;
DROP POLICY IF EXISTS "Admin can manage categories" ON categories;
DROP POLICY IF EXISTS "Only admins can manage categories" ON categories;
DROP POLICY IF EXISTS "categories_admin_all" ON categories;
DROP POLICY IF EXISTS "Admin can delete topics" ON wishlist_topics;
DROP POLICY IF EXISTS "Admins can delete any topic" ON wishlist_topics;
DROP POLICY IF EXISTS "admin_delete_topics_final" ON wishlist_topics;
DROP POLICY IF EXISTS "voting_rounds_admin_all" ON voting_rounds;
DROP POLICY IF EXISTS "Users can delete own comments or admin deletes any" ON comments;
DROP POLICY IF EXISTS "Users can delete their own comments or admins can delete any" ON comments;
DROP POLICY IF EXISTS "users_delete_comments_final" ON comments;

-- Create correct policies using auth.jwt() and auth.uid()

-- Categories policies
CREATE POLICY "categories_admin_access"
  ON categories
  FOR ALL
  TO authenticated
  USING ((auth.jwt() ->> 'email') = 'admin@sst.com')
  WITH CHECK ((auth.jwt() ->> 'email') = 'admin@sst.com');

-- Comics policies  
CREATE POLICY "comics_admin_access"
  ON comics
  FOR ALL
  TO authenticated
  USING ((auth.jwt() ->> 'email') = 'admin@sst.com')
  WITH CHECK ((auth.jwt() ->> 'email') = 'admin@sst.com');

-- Comic categories policies
CREATE POLICY "comic_categories_admin_access"
  ON comic_categories
  FOR ALL
  TO authenticated
  USING ((auth.jwt() ->> 'email') = 'admin@sst.com')
  WITH CHECK ((auth.jwt() ->> 'email') = 'admin@sst.com');

-- Comments policies
CREATE POLICY "comments_admin_delete"
  ON comments
  FOR DELETE
  TO authenticated
  USING ((auth.uid() = user_id) OR ((auth.jwt() ->> 'email') = 'admin@sst.com'));

-- Wishlist topics policies
CREATE POLICY "wishlist_topics_admin_delete"
  ON wishlist_topics
  FOR DELETE
  TO authenticated
  USING ((auth.jwt() ->> 'email') = 'admin@sst.com');

-- Voting rounds policies
CREATE POLICY "voting_rounds_admin_access"
  ON voting_rounds
  FOR ALL
  TO authenticated
  USING ((auth.jwt() ->> 'email') = 'admin@sst.com')
  WITH CHECK ((auth.jwt() ->> 'email') = 'admin@sst.com');

-- Fix user-specific policies to use auth.uid() instead of uid()
DROP POLICY IF EXISTS "auth_create_comments_final" ON comments;
DROP POLICY IF EXISTS "users_update_comments_final" ON comments;
DROP POLICY IF EXISTS "auth_rate_comics_final" ON user_ratings;
DROP POLICY IF EXISTS "users_update_ratings_final" ON user_ratings;
DROP POLICY IF EXISTS "auth_vote_final" ON wishlist_votes;
DROP POLICY IF EXISTS "users_delete_votes_final" ON wishlist_votes;
DROP POLICY IF EXISTS "auth_create_topics_final" ON wishlist_topics;

-- Recreate user policies with correct auth.uid()
CREATE POLICY "comments_user_create"
  ON comments
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "comments_user_update"
  ON comments
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "user_ratings_create"
  ON user_ratings
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_ratings_update"
  ON user_ratings
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "wishlist_votes_create"
  ON wishlist_votes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "wishlist_votes_user_delete"
  ON wishlist_votes
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "wishlist_topics_user_create"
  ON wishlist_topics
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);