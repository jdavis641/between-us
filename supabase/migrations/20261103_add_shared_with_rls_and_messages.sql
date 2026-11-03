-- Migration: Add shared_with RLS policy for generated_content and support in_app_messages columns

-- 1. Ensure shared_with column exists on generated_content
ALTER TABLE public.generated_content ADD COLUMN IF NOT EXISTS shared_with UUID[] DEFAULT '{}'::UUID[];

-- 2. Ensure in_app_messages columns exist
ALTER TABLE public.in_app_messages ADD COLUMN IF NOT EXISTS recipient_id UUID REFERENCES auth.users(id);
ALTER TABLE public.in_app_messages ADD COLUMN IF NOT EXISTS sender_id UUID REFERENCES auth.users(id);
ALTER TABLE public.in_app_messages ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'share';
ALTER TABLE public.in_app_messages ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.in_app_messages ADD COLUMN IF NOT EXISTS body TEXT;
ALTER TABLE public.in_app_messages ADD COLUMN IF NOT EXISTS payload JSONB DEFAULT '{}'::JSONB;

-- 3. Update generated_content RLS policies to allow recipients in shared_with to SELECT
ALTER TABLE public.generated_content ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own or shared generated_content" ON public.generated_content;
CREATE POLICY "Users can read own or shared generated_content" ON public.generated_content
  FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id
    OR user_id IS NULL
    OR (
      auth.uid()::text = ANY(shared_with::text[])
      OR auth.uid() = ANY(shared_with)
    )
  );

-- 4. Update in_app_messages RLS policies
ALTER TABLE public.in_app_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own in_app_messages" ON public.in_app_messages;
CREATE POLICY "Users can read own in_app_messages" ON public.in_app_messages
  FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id
    OR auth.uid() = recipient_id
  );
