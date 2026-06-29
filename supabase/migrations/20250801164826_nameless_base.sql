/*
  # Plataforma de Cómics SST - Schema Inicial

  1. Nuevas Tablas
    - `categories` - Categorías para clasificar cómics
    - `comics` - Información de los cómics
    - `comments` - Comentarios de usuarios en cómics
    - `comic_categories` - Relación muchos a muchos entre cómics y categorías
    - `user_ratings` - Calificaciones de usuarios para cómics
    - `wishlist_topics` - Temas propuestos por usuarios
    - `wishlist_votes` - Votos de usuarios en temas de wishlist

  2. Seguridad
    - Habilitar RLS en todas las tablas
    - Políticas para lectura pública y escritura autenticada
    - Políticas especiales para administradores
*/

-- Tabla de categorías
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  color text NOT NULL DEFAULT '#64748b',
  description text,
  created_at timestamptz DEFAULT now()
);

-- Tabla de cómics
CREATE TABLE IF NOT EXISTS comics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  cover_image text,
  file_url text,
  file_type text NOT NULL DEFAULT 'pdf',
  upload_date timestamptz DEFAULT now(),
  downloads integer DEFAULT 0,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- Tabla de comentarios
CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comic_id uuid REFERENCES comics(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  content text NOT NULL,
  comment_type text NOT NULL DEFAULT 'opinion' CHECK (comment_type IN ('opinion', 'suggestion')),
  created_at timestamptz DEFAULT now()
);

-- Tabla de relación cómics-categorías (muchos a muchos)
CREATE TABLE IF NOT EXISTS comic_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comic_id uuid REFERENCES comics(id) ON DELETE CASCADE,
  category_id uuid REFERENCES categories(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(comic_id, category_id)
);

-- Tabla de calificaciones de usuarios
CREATE TABLE IF NOT EXISTS user_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  comic_id uuid REFERENCES comics(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, comic_id)
);

-- Tabla de temas de wishlist
CREATE TABLE IF NOT EXISTS wishlist_topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- Tabla de votos en wishlist
CREATE TABLE IF NOT EXISTS wishlist_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id uuid REFERENCES wishlist_topics(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  UNIQUE(topic_id, user_id)
);

-- Habilitar RLS en todas las tablas
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE comics ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE comic_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist_votes ENABLE ROW LEVEL SECURITY;

-- Políticas para categories (lectura pública, escritura solo admin)
CREATE POLICY "Anyone can view categories"
  ON categories FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Only admins can manage categories"
  ON categories FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Políticas para comics (lectura pública, escritura solo admin)
CREATE POLICY "Anyone can view comics"
  ON comics FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Only admins can manage comics"
  ON comics FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Políticas para comic_categories (lectura pública, escritura solo admin)
CREATE POLICY "Anyone can view comic categories"
  ON comic_categories FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Only admins can manage comic categories"
  ON comic_categories FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Políticas para comments (lectura pública, escritura autenticada)
CREATE POLICY "Anyone can view comments"
  ON comments FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can create comments"
  ON comments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments"
  ON comments FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments or admins can delete any"
  ON comments FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Políticas para user_ratings (lectura pública, escritura autenticada)
CREATE POLICY "Anyone can view ratings"
  ON user_ratings FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can rate comics"
  ON user_ratings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ratings"
  ON user_ratings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Políticas para wishlist_topics (lectura pública, escritura autenticada)
CREATE POLICY "Anyone can view wishlist topics"
  ON wishlist_topics FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can create topics"
  ON wishlist_topics FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Admins can delete any topic"
  ON wishlist_topics FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Políticas para wishlist_votes (lectura pública, escritura autenticada)
CREATE POLICY "Anyone can view wishlist votes"
  ON wishlist_votes FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can vote"
  ON wishlist_votes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own votes"
  ON wishlist_votes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Insertar categorías iniciales
INSERT INTO categories (name, color, description) VALUES
  ('EPP', '#3b82f6', 'Equipos de Protección Personal'),
  ('Cuidado de Manos', '#10b981', 'Protección y cuidado de las manos en el trabajo'),
  ('Ergonomía', '#f59e0b', 'Postura y bienestar en el lugar de trabajo'),
  ('Prevención de Accidentes', '#ef4444', 'Identificación y prevención de riesgos'),
  ('Seguridad Industrial', '#8b5cf6', 'Normas y procedimientos de seguridad'),
  ('Primeros Auxilios', '#06b6d4', 'Atención médica básica en emergencias')
ON CONFLICT DO NOTHING;