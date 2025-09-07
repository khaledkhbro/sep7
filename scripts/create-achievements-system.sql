-- Create achievements and referral system tables
CREATE TABLE IF NOT EXISTS referral_achievements (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL DEFAULT 'referral',
    target_count INTEGER NOT NULL,
    reward_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    reward_type VARCHAR(20) NOT NULL DEFAULT 'cash',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create achievement requests table
CREATE TABLE IF NOT EXISTS achievement_requests (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    achievement_id INTEGER REFERENCES referral_achievements(id),
    status VARCHAR(20) DEFAULT 'pending',
    progress INTEGER DEFAULT 0,
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    notes TEXT
);

-- Create referral settings table
CREATE TABLE IF NOT EXISTS referral_settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user referrals table
CREATE TABLE IF NOT EXISTS user_referrals (
    id SERIAL PRIMARY KEY,
    referrer_id VARCHAR(50) NOT NULL,
    referred_id VARCHAR(50) NOT NULL,
    referral_code VARCHAR(20),
    status VARCHAR(20) DEFAULT 'active',
    is_vip BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(referrer_id, referred_id)
);

-- Insert default achievements
INSERT INTO referral_achievements (title, description, type, target_count, reward_amount, reward_type) VALUES
('Bronze Referrer', 'Refer 5 VIP users and earn a bonus reward', 'referral', 5, 25.00, 'cash'),
('Silver Referrer', 'Refer 10 VIP users and unlock premium benefits', 'referral', 10, 75.00, 'cash'),
('Gold Referrer', 'Refer 25 VIP users and become a top referrer', 'referral', 25, 200.00, 'cash'),
('Platinum Referrer', 'Refer 50 VIP users and join the elite referrer club', 'referral', 50, 500.00, 'cash')
ON CONFLICT DO NOTHING;

-- Insert default referral settings
INSERT INTO referral_settings (setting_key, setting_value) VALUES
('commission_settings', '{
    "firstDepositCommission": {"enabled": true, "percentage": 10},
    "firstPurchaseCommission": {"enabled": true, "percentage": 5},
    "microjobWorkBonus": {"enabled": true, "amount": 2},
    "signupBonus": {"enabled": true, "amount": 0.005},
    "lifetimeCommissionRange": {"enabled": true, "min": 0.05, "max": 20}
}'),
('system_behavior', '{
    "requireEmailVerification": true,
    "autoApproveReferrals": false,
    "maxReferralsPerUser": 1000
}'),
('page_content', '{
    "heroTitle": "Earn More with Referrals",
    "heroDescription": "Invite friends and earn commissions on their activities",
    "benefitsTitle": "Referral Benefits"
}')
ON CONFLICT (setting_key) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_achievement_requests_user_id ON achievement_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_achievement_requests_status ON achievement_requests(status);
CREATE INDEX IF NOT EXISTS idx_user_referrals_referrer_id ON user_referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_user_referrals_referred_id ON user_referrals(referred_id);
