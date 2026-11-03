-- Migration: Ensure welcome_dismissed column exists and is updatable by authenticated users
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS welcome_dismissed BOOLEAN DEFAULT false;
GRANT UPDATE (welcome_dismissed) ON public.profiles TO authenticated;
