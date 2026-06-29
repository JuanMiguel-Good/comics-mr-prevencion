/*
  # Configurar ganador de votación de hoy
  
  1. Buscar la ronda que terminó hoy
  2. Encontrar el tema con más votos
  3. Marcarlo como ganador
  4. Actualizar la ronda con el ganador
*/

-- Encontrar la ronda que terminó hoy y el tema con más votos
DO $$
DECLARE
    today_round_id uuid;
    winning_topic_id uuid;
    winning_votes_count int;
BEGIN
    -- Buscar ronda que terminó hoy
    SELECT id INTO today_round_id
    FROM voting_rounds 
    WHERE DATE(end_date) = CURRENT_DATE 
    AND status = 'active';
    
    IF today_round_id IS NOT NULL THEN
        -- Encontrar el tema con más votos en esa ronda
        SELECT 
            wt.id,
            COUNT(wv.id) as vote_count
        INTO winning_topic_id, winning_votes_count
        FROM wishlist_topics wt
        LEFT JOIN wishlist_votes wv ON wt.id = wv.topic_id
        WHERE wt.round_id = today_round_id
        GROUP BY wt.id
        ORDER BY COUNT(wv.id) DESC
        LIMIT 1;
        
        IF winning_topic_id IS NOT NULL THEN
            -- Marcar tema como ganador
            UPDATE wishlist_topics 
            SET status = 'winner' 
            WHERE id = winning_topic_id;
            
            -- Archivar otros temas de la misma ronda
            UPDATE wishlist_topics 
            SET status = 'archived' 
            WHERE round_id = today_round_id 
            AND id != winning_topic_id;
            
            -- Completar la ronda con el ganador
            UPDATE voting_rounds 
            SET 
                status = 'completed',
                winner_topic_id = winning_topic_id
            WHERE id = today_round_id;
            
            RAISE NOTICE 'Tema ganador configurado: % con % votos', winning_topic_id, winning_votes_count;
        END IF;
    END IF;
END $$;