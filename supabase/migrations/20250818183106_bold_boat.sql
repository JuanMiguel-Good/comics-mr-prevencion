/*
  # Sistema de Votaciones Ganadoras

  1. Cambios en tablas existentes
    - Agregar columna `winning_topic_id` a comics
    - Agregar columna `published_comic_id` a wishlist_topics
    - Actualizar constraint de status en wishlist_topics

  2. Nuevos estados para wishlist_topics
    - 'active': Tema activo en votación
    - 'winner': Tema que ganó votación, en desarrollo  
    - 'archived': Tema que no ganó
    - 'published': Tema ganador ya publicado como cómic

  3. Relaciones
    - comics ↔ wishlist_topics bidireccional
    - Para rastrear qué tema generó qué cómic
*/

-- Agregar columna para conectar cómics con temas ganadores
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'comics' AND column_name = 'winning_topic_id'
  ) THEN
    ALTER TABLE comics ADD COLUMN winning_topic_id uuid REFERENCES wishlist_topics(id);
  END IF;
END $$;

-- Agregar columna para conectar temas con cómics publicados  
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'wishlist_topics' AND column_name = 'published_comic_id'
  ) THEN
    ALTER TABLE wishlist_topics ADD COLUMN published_comic_id uuid REFERENCES comics(id);
  END IF;
END $$;

-- Actualizar constraint de status para incluir nuevos estados
DO $$
BEGIN
  -- Eliminar constraint existente si existe
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'wishlist_topics' AND constraint_name = 'wishlist_topics_status_check'
  ) THEN
    ALTER TABLE wishlist_topics DROP CONSTRAINT wishlist_topics_status_check;
  END IF;
  
  -- Agregar nuevo constraint con todos los estados
  ALTER TABLE wishlist_topics ADD CONSTRAINT wishlist_topics_status_check 
    CHECK (status = ANY (ARRAY['active'::text, 'winner'::text, 'archived'::text, 'published'::text]));
END $$;

-- Crear índices para mejorar performance en consultas de ganadores
CREATE INDEX IF NOT EXISTS idx_wishlist_topics_status_winner 
  ON wishlist_topics(status) WHERE status = 'winner';

CREATE INDEX IF NOT EXISTS idx_comics_winning_topic 
  ON comics(winning_topic_id) WHERE winning_topic_id IS NOT NULL;

-- Crear índice para consultas de rondas completadas
CREATE INDEX IF NOT EXISTS idx_voting_rounds_completed 
  ON voting_rounds(status, end_date) WHERE status = 'completed';