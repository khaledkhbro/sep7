-- Create user_favorites table for the favorites system
CREATE TABLE IF NOT EXISTS user_favorites (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(50) NOT NULL,
  service_id VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, service_id)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id ON user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_service_id ON user_favorites(service_id);
