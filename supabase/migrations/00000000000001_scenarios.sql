-- Create Scenarios Table
CREATE TABLE scenarios (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    group_id UUID REFERENCES connection_groups(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_mid_week BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Enable RLS
ALTER TABLE scenarios ENABLE ROW LEVEL SECURITY;

-- Users can view scenarios linked to their connection group
CREATE POLICY "View shared group scenarios" ON scenarios
    FOR SELECT USING (
        group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
    );

-- System/Service role needs to insert. For anon requests from the backend API:
CREATE POLICY "System can insert scenarios" ON scenarios
    FOR INSERT WITH CHECK (true);
