-- Add average_rating and times_tested to scenario_suggestions to track community performance
ALTER TABLE public.scenario_suggestions ADD COLUMN IF NOT EXISTS average_rating NUMERIC DEFAULT 0;
ALTER TABLE public.scenario_suggestions ADD COLUMN IF NOT EXISTS times_tested INTEGER DEFAULT 0;
