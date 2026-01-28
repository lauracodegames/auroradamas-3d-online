-- File: supabase/migrations/20240128000000_add_game_sync.sql

-- Migration para adicionar colunas de sincronização do jogo

-- Adicionar coluna para estado do jogo (JSON)
ALTER TABLE game_rooms 
ADD COLUMN IF NOT EXISTS game_state JSONB DEFAULT '{}';

-- Adicionar coluna para controle de vez do jogador
ALTER TABLE game_rooms 
ADD COLUMN IF NOT EXISTS current_turn TEXT;

-- Adicionar coluna para status do jogo (waiting, playing, finished)
ALTER TABLE game_rooms 
ADD COLUMN IF NOT EXISTS game_status TEXT DEFAULT 'waiting';

-- Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_game_rooms_current_turn 
ON game_rooms(current_turn);

-- Criar índice para status
CREATE INDEX IF NOT EXISTS idx_game_rooms_status 
ON game_rooms(game_status);

-- Atualizar salas existentes para ter current_turn igual ao host_id
UPDATE game_rooms 
SET current_turn = host_id 
WHERE current_turn IS NULL AND host_id IS NOT NULL;

-- Atualizar status baseado na coluna status existente
UPDATE game_rooms 
SET game_status = CASE 
  WHEN status = 'waiting' THEN 'waiting'
  WHEN status = 'playing' THEN 'playing'
  ELSE 'waiting'
END
WHERE game_status IS NULL;
