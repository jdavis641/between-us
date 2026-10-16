-- Migration: Enable shared content reading for active users and create bridging table

-- 1. Ensure is_shared column exists on generated_content
ALTER TABLE public.generated_content ADD COLUMN IF NOT EXISTS is_shared BOOLEAN DEFAULT false;

-- 2. Create bridging table for explicit shared access
CREATE TABLE IF NOT EXISTS public.shared_content_access (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  content_id UUID REFERENCES public.generated_content(id) ON DELETE CASCADE,
  shared_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_shared_content UNIQUE(content_id)
);

-- 3. Enable RLS on bridging table
ALTER TABLE public.shared_content_access ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated read shared_content_access" ON public.shared_content_access;
CREATE POLICY "Allow authenticated read shared_content_access" ON public.shared_content_access
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow owner insert shared_content_access" ON public.shared_content_access;
CREATE POLICY "Allow owner insert shared_content_access" ON public.shared_content_access
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.generated_content
      WHERE generated_content.id = content_id
      AND (generated_content.user_id = auth.uid() OR generated_content.user_id IS NULL)
    )
  );

-- 4. Update generated_content RLS policies
ALTER TABLE public.generated_content ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated read generated_content" ON public.generated_content;
DROP POLICY IF EXISTS "Users can read own or shared generated_content" ON public.generated_content;

CREATE POLICY "Users can read own or shared generated_content" ON public.generated_content
  FOR SELECT TO authenticated
  USING (
    -- Content creator can read their own generated content
    auth.uid() = user_id
    OR
    -- Curated system/library content with no specific user owner
    user_id IS NULL
    OR
    -- Content explicitly shared and viewer is an active user
    (
      (
        is_shared = true
        OR id IN (SELECT content_id FROM public.shared_content_access)
      )
      AND EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.is_active = true
      )
    )
  );
