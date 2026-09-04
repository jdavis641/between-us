CREATE TABLE invitations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    creator_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    group_id UUID REFERENCES connection_groups(id) ON DELETE CASCADE,
    invite_token UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL,
    invite_type TEXT CHECK (invite_type IN ('couple', 'single')),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours'),
    is_used BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- Allow system/service_role to manage invitations unconditionally (implicitly allowed)
-- Allow users to view their own invitations
CREATE POLICY "Users can view their own generated invites" ON invitations
    FOR SELECT USING (creator_id = auth.uid());
