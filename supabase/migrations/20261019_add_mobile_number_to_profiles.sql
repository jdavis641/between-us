-- Add optional mobile_number column to public.profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS mobile_number TEXT;
