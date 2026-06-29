-- Fix RLS policies that are causing permission denied errors
-- The issue is that our policies reference auth.users but we don't have proper access to it

-- 1. Fix Categories policies
DROP POLICY IF EXISTS "Only admins can manage categories" ON categories;

CREATE POLICY "Only admins can manage categories"
  ON categories
  FOR ALL
  TO authenticated
  USING (
    -- Allow admin email directly
    auth.email() = 'admin@sst.com' OR
    -- Or check raw_user_meta_data for role
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'admin'
  );

-- 2. Fix Comics policies  
DROP POLICY IF EXISTS "Only admins can manage comics" ON comics;

CREATE POLICY "Only admins can manage comics"
  ON comics
  FOR ALL
  TO authenticated
  USING (
    auth.email() = 'admin@sst.com' OR
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'admin'
  );

-- 3. Fix Comic Categories policies
DROP POLICY IF EXISTS "Only admins can manage comic categories" ON comic_categories;

CREATE POLICY "Only admins can manage comic categories"
  ON comic_categories
  FOR ALL
  TO authenticated
  USING (
    auth.email() = 'admin@sst.com' OR
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'admin'
  );

-- 4. Fix Comments delete policy
DROP POLICY IF EXISTS "Users can delete their own comments or admins can delete any" ON comments;

CREATE POLICY "Users can delete their own comments or admins can delete any"
  ON comments
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id OR 
    auth.email() = 'admin@sst.com' OR
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'admin'
  );

-- 5. Fix Wishlist Topics delete policy
DROP POLICY IF EXISTS "Admins can delete any topic" ON wishlist_topics;

CREATE POLICY "Admins can delete any topic"
  ON wishlist_topics
  FOR DELETE
  TO authenticated
  USING (
    auth.email() = 'admin@sst.com' OR
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'admin'
  );

-- 6. Also fix storage policies if they exist
DROP POLICY IF EXISTS "Admins can upload files" ON storage.objects;

CREATE POLICY "Admins can upload files"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'comics' AND (
      auth.email() = 'admin@sst.com' OR
      (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'admin'
    )
  );