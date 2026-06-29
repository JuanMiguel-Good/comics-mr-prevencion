-- Create storage bucket for comics files
INSERT INTO storage.buckets (id, name, public) VALUES ('comics', 'comics', true);

-- Policy to allow authenticated users to upload files
CREATE POLICY "Allow authenticated users to upload files" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'comics');

-- Policy to allow everyone to view files
CREATE POLICY "Allow public access to files" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'comics');

-- Policy to allow admins to delete files
CREATE POLICY "Allow admins to delete files" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'comics' AND
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );