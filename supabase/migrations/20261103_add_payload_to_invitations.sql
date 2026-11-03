-- Migration: Add payload JSONB column to invitations table for Guest Pass and Between Us Pass details
ALTER TABLE public.invitations ADD COLUMN IF NOT EXISTS payload JSONB DEFAULT '{}'::JSONB;
