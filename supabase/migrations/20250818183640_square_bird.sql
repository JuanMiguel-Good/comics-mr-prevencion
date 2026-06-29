/*
# Agregar columnas para sistema de votaciones ganadoras

## Cambios
1. Nueva columna en comics: winning_topic_id (nullable)
2. Nueva columna en wishlist_topics: published_comic_id (nullable)

Estas columnas permitirán conectar cómics con temas ganadores de votaciones.
*/

-- Solo agregar las columnas necesarias sin tocar políticas existentes

-- Agregar columna en comics para conectar con tema ganador
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'comics' AND column_name = 'winning_topic_id'
    ) THEN
        ALTER TABLE comics ADD COLUMN winning_topic_id uuid REFERENCES wishlist_topics(id);
    END IF;
END $$;

-- Agregar columna en wishlist_topics para conectar con cómic publicado
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'wishlist_topics' AND column_name = 'published_comic_id'
    ) THEN
        ALTER TABLE wishlist_topics ADD COLUMN published_comic_id uuid REFERENCES comics(id);
    END IF;
END $$;