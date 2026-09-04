CREATE TABLE content_ratings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    content_type TEXT CHECK (content_type IN ('game', 'roleplay', 'literature')),
    content_id TEXT NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE user_suggestions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    suggestion_text TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS
ALTER TABLE content_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_suggestions ENABLE ROW LEVEL SECURITY;

-- Allow users to insert ratings anonymously (from other users' perspective)
CREATE POLICY "Users can insert content ratings" ON content_ratings
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow users to view only their own ratings
CREATE POLICY "Users can view own ratings" ON content_ratings
    FOR SELECT USING (user_id = auth.uid());

-- Allow users to insert suggestions
CREATE POLICY "Users can insert suggestions" ON user_suggestions
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow users to view only their own suggestions
CREATE POLICY "Users can view own suggestions" ON user_suggestions
    FOR SELECT USING (user_id = auth.uid());
