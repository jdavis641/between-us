import os

sql = '''-- Enable pgcrypto for UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create Couples Table
CREATE TABLE couples (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('trial', 'active', 'inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create Profiles Table
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    anonymous_alias TEXT,
    pronouns TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create Couple Members Table
CREATE TABLE couple_members (
    couple_id UUID REFERENCES couples(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    PRIMARY KEY (couple_id, user_id)
);

-- Create Intimacy Preferences Table
CREATE TABLE intimacy_preferences (
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    couple_id UUID REFERENCES couples(id) ON DELETE CASCADE,
    category_tag TEXT NOT NULL,
    preference_level TEXT NOT NULL CHECK (preference_level IN ('definitely', 'curious', 'off_limits')),
    PRIMARY KEY (user_id, category_tag)
);

-- Create Guest Passes Table
CREATE TABLE guest_passes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    host_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Create Scenario Ratings Table
CREATE TABLE scenario_ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scenario_id TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    feedback_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create Scenario Suggestions Table
CREATE TABLE scenario_suggestions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    suggestion_text TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ENABLE ROW LEVEL SECURITY
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE couples ENABLE ROW LEVEL SECURITY;
ALTER TABLE couple_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE intimacy_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE guest_passes ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenario_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenario_suggestions ENABLE ROW LEVEL SECURITY;

-- RLS POLICIES

-- Profiles
CREATE POLICY "Users can view own profile." ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile." ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile." ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Couples
CREATE POLICY "Users can view their couples." ON couples FOR SELECT USING (
    id IN (SELECT couple_id FROM couple_members WHERE user_id = auth.uid())
);
CREATE POLICY "Users can insert couples." ON couples FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their couples." ON couples FOR UPDATE USING (
    id IN (SELECT couple_id FROM couple_members WHERE user_id = auth.uid())
);

-- Couple Members
CREATE POLICY "Users can view their couple memberships." ON couple_members FOR SELECT USING (
    couple_id IN (SELECT couple_id FROM couple_members WHERE user_id = auth.uid())
);
CREATE POLICY "Users can insert couple memberships." ON couple_members FOR INSERT WITH CHECK (
    user_id = auth.uid() OR couple_id IN (SELECT id FROM couples)
);

-- Intimacy Preferences
CREATE POLICY "Users can view own preferences." ON intimacy_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own preferences." ON intimacy_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own preferences." ON intimacy_preferences FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can view partner's non-off-limits preferences." ON intimacy_preferences FOR SELECT USING (
    auth.uid() != user_id AND 
    couple_id IN (SELECT couple_id FROM couple_members WHERE user_id = auth.uid()) AND
    preference_level != 'off_limits'
);

-- Guest Passes
CREATE POLICY "Users can view own guest passes." ON guest_passes FOR SELECT USING (auth.uid() = host_user_id);
CREATE POLICY "Users can insert own guest passes." ON guest_passes FOR INSERT WITH CHECK (auth.uid() = host_user_id);

-- Scenario Ratings
CREATE POLICY "Anyone can insert scenario ratings." ON scenario_ratings FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can view scenario ratings." ON scenario_ratings FOR SELECT USING (true);

-- Scenario Suggestions
CREATE POLICY "Users can insert suggestions." ON scenario_suggestions FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Users can view own suggestions." ON scenario_suggestions FOR SELECT USING (auth.uid() = user_id);

'''

with open('supabase/migrations/00000000000000_init_schema.sql', 'w') as f:
    f.write(sql)
