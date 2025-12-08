-- SDR (Sound Design Recipes) Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Creators table
CREATE TABLE creators (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tiktok_handle VARCHAR(255) UNIQUE NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    is_claimed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tutorials table
CREATE TABLE tutorials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
    tiktok_url TEXT NOT NULL,
    tiktok_video_id VARCHAR(255) UNIQUE NOT NULL,
    title VARCHAR(500) NOT NULL,
    sound_type VARCHAR(100) NOT NULL,
    raw_transcription TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Instructions table
CREATE TABLE instructions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tutorial_id UUID NOT NULL REFERENCES tutorials(id) ON DELETE CASCADE,
    step_number INTEGER NOT NULL,
    description TEXT NOT NULL,
    ableton_device VARCHAR(255),
    parameters JSONB DEFAULT '{}',
    notes TEXT,
    screenshot_url TEXT
);

-- Indexes for performance
CREATE INDEX idx_tutorials_creator_id ON tutorials(creator_id);
CREATE INDEX idx_tutorials_status ON tutorials(status);
CREATE INDEX idx_tutorials_sound_type ON tutorials(sound_type);
CREATE INDEX idx_tutorials_video_id ON tutorials(tiktok_video_id);
CREATE INDEX idx_instructions_tutorial_id ON instructions(tutorial_id);
CREATE INDEX idx_creators_handle ON creators(tiktok_handle);

-- Row Level Security (RLS) - Enable for production
ALTER TABLE creators ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutorials ENABLE ROW LEVEL SECURITY;
ALTER TABLE instructions ENABLE ROW LEVEL SECURITY;

-- Public read access policies
CREATE POLICY "Public can view creators" ON creators
    FOR SELECT USING (true);

CREATE POLICY "Public can view approved tutorials" ON tutorials
    FOR SELECT USING (status = 'approved');

CREATE POLICY "Public can view instructions" ON instructions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM tutorials 
            WHERE tutorials.id = instructions.tutorial_id 
            AND tutorials.status = 'approved'
        )
    );

-- Service role can do everything (for backend)
CREATE POLICY "Service role full access to creators" ON creators
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access to tutorials" ON tutorials
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access to instructions" ON instructions
    FOR ALL USING (auth.role() = 'service_role');

-- Anon key can insert (for transcription submissions)
CREATE POLICY "Anon can insert creators" ON creators
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Anon can insert tutorials" ON tutorials
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Anon can insert instructions" ON instructions
    FOR INSERT WITH CHECK (true);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tutorials_updated_at
    BEFORE UPDATE ON tutorials
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();
