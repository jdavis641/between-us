-- Migration: Add marketing attribution columns to profiles for Meta campaign tracking
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS utm_campaign TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS utm_source TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS utm_medium TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS utm_content TEXT;

-- Grant column update permissions to authenticated users
GRANT UPDATE (utm_campaign, utm_source, utm_medium, utm_content) ON public.profiles TO authenticated;
