-- Fix Intimacy Games RLS
ALTER TABLE public.intimacy_games ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated read intimacy_games" ON public.intimacy_games;
CREATE POLICY "Allow authenticated read intimacy_games" ON public.intimacy_games FOR SELECT TO authenticated USING (true);

-- Fix Generated Content RLS
ALTER TABLE public.generated_content ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated read generated_content" ON public.generated_content;
CREATE POLICY "Allow authenticated read generated_content" ON public.generated_content FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow authenticated insert generated_content" ON public.generated_content;
CREATE POLICY "Allow authenticated insert generated_content" ON public.generated_content FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Allow authenticated update generated_content" ON public.generated_content;
CREATE POLICY "Allow authenticated update generated_content" ON public.generated_content FOR UPDATE TO authenticated USING (auth.uid() = user_id);