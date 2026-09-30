CREATE TABLE IF NOT EXISTS public.app_improvements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    feedback_text TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
