-- Create user favorites table for persistent wishlist functionality
CREATE TABLE IF NOT EXISTS user_favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    job_id UUID NOT NULL REFERENCES microjobs(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, job_id)
);

-- Create indexes for optimal query performance
CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id ON user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_job_id ON user_favorites(job_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_created_at ON user_favorites(created_at DESC);

-- Create composite index for efficient user-specific queries
CREATE INDEX IF NOT EXISTS idx_user_favorites_user_created ON user_favorites(user_id, created_at DESC);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_favorites_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_favorites_updated_at
    BEFORE UPDATE ON user_favorites
    FOR EACH ROW
    EXECUTE FUNCTION update_user_favorites_updated_at();
