/*
  # Marcar ganador de votación de hoy
  
  1. Actualizar ronda de votación como completada
  2. Marcar tema ganador basado en votación real
  3. Archivar temas perdedores
*/

-- Primero, encontrar la ronda activa de hoy y el tema con más votos
WITH round_data AS (
  SELECT 
    vr.id as round_id,
    vr.end_date,
    wt.id as topic_id,
    wt.title,
    COUNT(wv.user_id) as vote_count,
    ROW_NUMBER() OVER (ORDER BY COUNT(wv.user_id) DESC) as rank
  FROM voting_rounds vr
  JOIN wishlist_topics wt ON wt.round_id = vr.id
  LEFT JOIN wishlist_votes wv ON wv.topic_id = wt.id
  WHERE vr.status = 'active'
    AND DATE(vr.end_date AT TIME ZONE 'UTC') <= CURRENT_DATE
  GROUP BY vr.id, vr.end_date, wt.id, wt.title
),
winner AS (
  SELECT * FROM round_data WHERE rank = 1
)

-- Actualizar la ronda como completada con el ganador
UPDATE voting_rounds 
SET 
  status = 'completed',
  winner_topic_id = (SELECT topic_id FROM winner)
WHERE id = (SELECT round_id FROM winner);

-- Marcar el tema ganador
UPDATE wishlist_topics 
SET status = 'winner'
WHERE id = (SELECT topic_id FROM round_data WHERE rank = 1);

-- Archivar los temas que no ganaron
UPDATE wishlist_topics 
SET status = 'archived'
WHERE round_id = (SELECT round_id FROM round_data WHERE rank = 1)
  AND id != (SELECT topic_id FROM round_data WHERE rank = 1);

-- Verificar resultado
DO $$
BEGIN
  RAISE NOTICE 'Votación completada. Ganador: %', 
    (SELECT title FROM wishlist_topics WHERE status = 'winner' ORDER BY created_at DESC LIMIT 1);
END $$;