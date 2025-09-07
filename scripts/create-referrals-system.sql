-- Create referrals system tables
-- This script creates all the necessary tables for the referrals functionality

-- Add referral_code column to users table if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_code VARCHAR(20) UNIQUE;

-- Create referrals table
CREATE TABLE IF NOT EXISTS referrals (
    id SERIAL PRIMARY KEY,
    referrer_id VARCHAR(50) NOT NULL,
    referred_user_id VARCHAR(50) NOT NULL,
    referral_code VARCHAR(20) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    is_vip BOOLEAN DEFAULT false,
    vip_method VARCHAR(50),
    vip_achieved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (referrer_id) REFERENCES users(id),
    FOREIGN KEY (referred_user_id) REFERENCES users(id),
    UNIQUE(referrer_id, referred_user_id)
);

-- Create achievements table (if not exists from previous script)
CREATE TABLE IF NOT EXISTS achievements (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    referral_requirement INTEGER NOT NULL,
    reward_amount DECIMAL(10,2) DEFAULT 0,
    reward_type VARCHAR(50) DEFAULT 'cash',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create achievement_requests table (if not exists from previous script)
CREATE TABLE IF NOT EXISTS achievement_requests (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    achievement_id INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP,
    notes TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (achievement_id) REFERENCES achievements(id),
    UNIQUE(user_id, achievement_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_user_id ON referrals(referred_user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);
CREATE INDEX IF NOT EXISTS idx_achievement_requests_user_id ON achievement_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_achievement_requests_status ON achievement_requests(status);

-- Generate referral codes for existing users who don't have them
UPDATE users 
SET referral_code = 'REF' || LPAD(id::text, 6, '0')
WHERE referral_code IS NULL;

-- Insert some default achievements if none exist
INSERT INTO achievements (title, description, referral_requirement, reward_amount, reward_type) 
SELECT * FROM (VALUES
    ('Bronze Referrer', 'Refer 5 VIP users and earn a bonus reward', 5, 25.00, 'cash'),
    ('Silver Referrer', 'Refer 10 VIP users and unlock premium benefits', 10, 75.00, 'cash'),
    ('Gold Referrer', 'Refer 25 VIP users and become a top referrer', 25, 200.00, 'cash'),
    ('Platinum Referrer', 'Refer 50 VIP users and join the elite referrer club', 50, 500.00, 'cash')
) AS v(title, description, referral_requirement, reward_amount, reward_type)
WHERE NOT EXISTS (SELECT 1 FROM achievements);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers
DROP TRIGGER IF EXISTS update_referrals_updated_at ON referrals;
CREATE TRIGGER update_referrals_updated_at 
    BEFORE UPDATE ON referrals 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_achievements_updated_at ON achievements;
CREATE TRIGGER update_achievements_updated_at 
    BEFORE UPDATE ON achievements 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
