-- Migration: Add is_favorite column to generated_content and create user_favorites table

-- 1. Add is_favorite column to generated_content
ALTER TABLE public.generated_content 
ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_generated_content_is_favorite 
ON public.generated_content(is_favorite);

-- 2. Create user_favorites cross-reference table
CREATE TABLE IF NOT EXISTS public.user_favorites (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    content_id UUID REFERENCES public.generated_content(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_user_content_favorite UNIQUE(user_id, content_id)
);

CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id 
ON public.user_favorites(user_id);

-- 3. Enable RLS on user_favorites
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own favorites" ON public.user_favorites;
CREATE POLICY "Users can read own favorites" ON public.user_favorites
    FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own favorites" ON public.user_favorites;
CREATE POLICY "Users can insert own favorites" ON public.user_favorites
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own favorites" ON public.user_favorites;
CREATE POLICY "Users can delete own favorites" ON public.user_favorites
    FOR DELETE TO authenticated USING (auth.uid() = user_id);
