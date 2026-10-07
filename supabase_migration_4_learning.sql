CREATE TABLE IF NOT EXISTS learning_activity (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    event_date TIMESTAMP WITH TIME ZONE NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    skill_name VARCHAR(100),         
    evidence_url TEXT,               
    weight INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS
ALTER TABLE learning_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own learning activity" 
    ON learning_activity FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own learning activity" 
    ON learning_activity FOR INSERT 
    WITH CHECK (auth.uid() = user_id);
