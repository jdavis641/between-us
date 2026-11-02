-- Migration: Add off_limits column to profiles for user boundary exclusions
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS off_limits JSONB DEFAULT '[]'::jsonb;
