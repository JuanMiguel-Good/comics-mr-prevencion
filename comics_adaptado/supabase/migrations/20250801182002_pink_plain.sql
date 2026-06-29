/*
  # Create comics table

  1. New Tables
    - `comics`
      - `id` (uuid, primary key)
      - `title` (text)
      - `description` (text)
      - `cover_image` (text, optional)
      - `file_url` (text, optional)
      - `file_type` (text, default 'pdf')
      - `upload_date` (timestamp)
      - `downloads` (integer, default 0)
      - `created_by` (uuid, foreign key to users)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `comics` table
    - Add policies for public viewing and admin management
*/

CREATE TABLE IF NOT EXISTS comics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  cover_image text,
  file_url text,
  file_type text DEFAULT 'pdf',
  upload_date timestamptz DEFAULT now(),
  downloads integer DEFAULT 0,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE comics ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view comics" ON comics;
DROP POLICY IF EXISTS "Only admins can manage comics" ON comics;

-- Create policies
CREATE POLICY "Anyone can view comics"
  ON comics
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Only admins can manage comics"
  ON comics
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (auth.users.raw_user_meta_data->>'role' = 'admin')
    )
  );