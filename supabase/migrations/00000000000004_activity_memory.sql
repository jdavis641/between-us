CREATE TABLE activity_history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    group_id UUID REFERENCES connection_groups(id) ON DELETE CASCADE,
    content_type TEXT CHECK (content_type IN ('game', 'roleplay', 'literature')),
    category TEXT,
    content_title TEXT NOT NULL,
    tags TEXT[],
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS
ALTER TABLE activity_history ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own history, or history of their group
CREATE POLICY "Users can view their own activity history" ON activity_history
    FOR SELECT USING (
        user_id = auth.uid() OR
        group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
    );

-- Allow users to insert their own history
CREATE POLICY "Users can insert activity history" ON activity_history
    FOR INSERT WITH CHECK (
        user_id = auth.uid() OR
        group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
    );
