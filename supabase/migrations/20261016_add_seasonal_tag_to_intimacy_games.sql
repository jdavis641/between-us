-- Migration: Add seasonal_tag column to intimacy_games table
ALTER TABLE public.intimacy_games ADD COLUMN IF NOT EXISTS seasonal_tag TEXT;
CREATE INDEX IF NOT EXISTS idx_intimacy_games_seasonal_tag ON public.intimacy_games(seasonal_tag);
