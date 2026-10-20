-- Migration: Enforce onboarding columns, partner search RLS bypass, and saved guest pass configurations

-- 1. Ensure mobile_number and literature_prompt_status exist on profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS mobile_number TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS literature_prompt_status TEXT DEFAULT 'pending';

-- 2. Create saved_pass_configs table for Between Us Guest Pass configurations
CREATE TABLE IF NOT EXISTS public.saved_pass_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    config_name TEXT,
    selected_boundaries JSONB,
    instructions TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.saved_pass_configs ENABLE ROW LEVEL SECURITY;

-- Allow users to manage their own configurations
DROP POLICY IF EXISTS "Manage own configs" ON public.saved_pass_configs;
CREATE POLICY "Manage own configs" ON public.saved_pass_configs 
FOR ALL USING (auth.uid() = user_id);

-- 3. Create secure RPC function for partner search to bypass RLS
CREATE OR REPLACE FUNCTION search_partner(search_term TEXT) 
RETURNS TABLE(id UUID, anonymous_alias TEXT) AS $$ 
BEGIN 
  RETURN QUERY 
  SELECT p.id, p.anonymous_alias 
  FROM public.profiles p 
  WHERE p.anonymous_alias ILIKE search_term OR p.email ILIKE search_term 
  LIMIT 1; 
END; 
$$ LANGUAGE plpgsql SECURITY DEFINER;
