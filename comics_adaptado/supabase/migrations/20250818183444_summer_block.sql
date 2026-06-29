/*
  # Sistema de Votaciones Ganadoras

  1. Nuevas Columnas
    - `comics` tabla: `winning_topic_id` para conectar cómics con temas ganadores
    - `wishlist_topics` tabla: `published_comic_id` para enlace bidireccional
    
  2. Actualizaciones de Políticas
    - Mantener políticas existentes que funcionan
    - Solo agregar las nuevas columnas sin modificar RLS
    
  3. Índices para Performance
    - Índice en `winning_topic_id` para búsquedas rápidas
*/

-- Agregar columna winning_topic_id a comics
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'comics' AND column_name = 'winning_topic_id'
  ) THEN
    ALTER TABLE comics ADD COLUMN winning_topic_id uuid REFERENCES wishlist_topics(id);
  END IF;
END $$;

-- Agregar columna published_comic_id a wishlist_topics
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'wishlist_topics' AND column_name = 'published_comic_id'  
  ) THEN
    ALTER TABLE wishlist_topics ADD COLUMN published_comic_id uuid REFERENCES comics(id);
  END IF;
END $$;

-- Crear índices para mejor performance
CREATE INDEX IF NOT EXISTS idx_comics_winning_topic_id ON comics(winning_topic_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_topics_published_comic_id ON wishlist_topics(published_comic_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_topics_status ON wishlist_topics(status);

-- Comentarios para documentación
COMMENT ON COLUMN comics.winning_topic_id IS 'Referencias el tema de wishlist que ganó la votación (si aplica)';
COMMENT ON COLUMN wishlist_topics.published_comic_id IS 'Referencias el cómic publicado para este tema ganador (si aplica)';