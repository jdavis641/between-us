-- Migration: Add onboarding survey tracking to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_survey_sent BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS survey_sent_at TIMESTAMP WITH TIME ZONE;
