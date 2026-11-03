-- Migration: Add content and updated_at columns to generated_content
ALTER TABLE public.generated_content ADD COLUMN IF NOT EXISTS content TEXT;
ALTER TABLE public.generated_content ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW());
