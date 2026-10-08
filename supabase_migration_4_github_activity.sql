-- Supabase Migration: Real Developer Activity Analysis (Feature 3)

CREATE TABLE IF NOT EXISTS github_activity (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    github_username TEXT NOT NULL,
    overall_score INTEGER NOT NULL DEFAULT 0,
    status_label TEXT NOT NULL DEFAULT 'No Evidence',
    sub_scores JSONB NOT NULL DEFAULT '{}'::jsonb,
    activity_timeline JSONB NOT NULL DEFAULT '[]'::jsonb,
    total_repositories INTEGER DEFAULT 0,
    total_commits_90d INTEGER DEFAULT 0,
    pull_requests_count INTEGER DEFAULT 0,
    issues_count INTEGER DEFAULT 0,
    languages JSONB DEFAULT '[]'::jsonb,
    stars_count INTEGER DEFAULT 0,
    forks_count INTEGER DEFAULT 0,
    reasons JSONB DEFAULT '[]'::jsonb,
    improvement_steps JSONB DEFAULT '[]'::jsonb,
    raw_metrics JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE github_activity ENABLE ROW LEVEL SECURITY;

-- Allow users to manage their own records or read publicly if guest
CREATE POLICY "Users can view own github activity" 
    ON github_activity FOR SELECT 
    USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert own github activity" 
    ON github_activity FOR INSERT 
    WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update own github activity" 
    ON github_activity FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_github_activity_username ON github_activity(github_username);
