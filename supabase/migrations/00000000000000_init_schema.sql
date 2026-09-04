-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles Table (Blind Authentication)
CREATE TABLE profiles (
    id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
    anonymous_alias TEXT,
    pronouns TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 2. Connection Groups (Couples, Guest Passes, and Events)
CREATE TABLE connection_groups (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    group_type TEXT CHECK (group_type IN ('couple', 'guest_pass', 'event')),
    status TEXT DEFAULT 'trial',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 3. Group Members (Links users to their respective groups)
CREATE TABLE group_members (
    group_id UUID REFERENCES connection_groups(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    PRIMARY KEY (group_id, user_id)
);

-- 4. Intimacy Preferences (The Boundary Matrix)
CREATE TABLE intimacy_preferences (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    group_id UUID REFERENCES connection_groups(id) ON DELETE CASCADE,
    category_tag TEXT NOT NULL,
    preference_level TEXT CHECK (preference_level IN ('Definitely', 'Curious', 'Off-Limits'))
);

-- 5. Scenario Ratings (Anonymous Feedback)
CREATE TABLE scenario_ratings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    scenario_id TEXT NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    feedback_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 6. Scenario Suggestions (Admin Pipeline)
CREATE TABLE scenario_suggestions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    suggestion_text TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 7. Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE intimacy_preferences ENABLE ROW LEVEL SECURITY;

-- 8. RLS Policies for Strict Privacy
-- Users can read profiles of people in their shared groups
CREATE POLICY "View shared group profiles" ON profiles
    FOR SELECT USING (
        id IN (
            SELECT user_id FROM group_members WHERE group_id IN (
                SELECT group_id FROM group_members WHERE user_id = auth.uid()
            )
        )
    );

-- Users can only see preferences in their group that are NOT "Off-Limits"
CREATE POLICY "Hide Off-Limits and Enforce Group Privacy" ON intimacy_preferences
    FOR SELECT USING (
        group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
        AND preference_level != 'Off-Limits'
    );
    
-- Users can insert and manage their own preferences
CREATE POLICY "Manage own preferences" ON intimacy_preferences
    FOR ALL USING (user_id = auth.uid());
