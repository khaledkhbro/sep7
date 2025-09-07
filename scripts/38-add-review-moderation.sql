-- Add moderation fields to marketplace_reviews table
ALTER TABLE marketplace_reviews 
ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS hidden_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS hidden_by VARCHAR(255),
ADD COLUMN IF NOT EXISTS moderation_reason TEXT;

-- Add index for moderation queries
CREATE INDEX IF NOT EXISTS idx_marketplace_reviews_moderation 
ON marketplace_reviews(is_hidden, is_deleted, created_at);

-- Update existing reviews to be visible by default
UPDATE marketplace_reviews 
SET is_hidden = FALSE 
WHERE is_hidden IS NULL;
