-- Enhanced Referral System Database Schema

-- VIP Jobs Configuration (Admin can mark jobs as VIP)
CREATE TABLE IF NOT EXISTS vip_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES microjobs(id) ON DELETE CASCADE,
    is_vip BOOLEAN DEFAULT TRUE,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(job_id)
);

-- Referral Achievements System
CREATE TABLE IF NOT EXISTS referral_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    vip_requirement INTEGER NOT NULL, -- Number of VIP referrals required
    reward_amount DECIMAL(10,2) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Achievement Progress and Requests
CREATE TABLE IF NOT EXISTS user_achievement_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    achievement_id UUID NOT NULL REFERENCES referral_achievements(id),
    vip_referrals_count INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'paid'
    admin_notes TEXT,
    processed_by UUID REFERENCES users(id),
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, achievement_id)
);

-- Enhanced Referrals Table (add VIP tracking)
ALTER TABLE referrals 
ADD COLUMN IF NOT EXISTS is_vip BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS vip_achieved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS vip_method VARCHAR(20), -- 'deposit', 'job_completion'
ADD COLUMN IF NOT EXISTS commission_rate DECIMAL(5,4) DEFAULT 0.0000,
ADD COLUMN IF NOT EXISTS commission_earned DECIMAL(10,2) DEFAULT 0.00;

-- Referral Commission Settings
CREATE TABLE IF NOT EXISTS referral_commission_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_name VARCHAR(50) UNIQUE NOT NULL,
    normal_refer_rate DECIMAL(5,4) DEFAULT 0.0000, -- e.g., 0.0100 for $0.01
    vip_refer_rate DECIMAL(5,4) DEFAULT 0.0000, -- e.g., 0.0500 for $0.05
    first_deposit_commission DECIMAL(5,2) DEFAULT 0.00, -- percentage
    microjob_commission DECIMAL(5,2) DEFAULT 0.00, -- percentage
    service_commission DECIMAL(5,2) DEFAULT 0.00, -- percentage
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Referral Commission Transactions
CREATE TABLE IF NOT EXISTS referral_commissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id UUID NOT NULL REFERENCES users(id),
    referred_id UUID NOT NULL REFERENCES users(id),
    referral_id UUID NOT NULL REFERENCES referrals(id),
    commission_type VARCHAR(30) NOT NULL, -- 'first_deposit', 'microjob_earning', 'service_purchase'
    base_amount DECIMAL(10,2) NOT NULL, -- The amount the commission is calculated from
    commission_rate DECIMAL(5,4) NOT NULL,
    commission_amount DECIMAL(10,2) NOT NULL,
    reference_id UUID, -- ID of the transaction/order that generated this commission
    reference_type VARCHAR(30), -- 'deposit', 'job_payment', 'service_order'
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'paid', 'cancelled'
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Deposits Tracking (for VIP status)
CREATE TABLE IF NOT EXISTS user_deposits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(50),
    transaction_id VARCHAR(100),
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'completed', 'failed'
    is_first_deposit BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Job Completions Tracking (for VIP status)
CREATE TABLE IF NOT EXISTS job_completions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES microjobs(id),
    worker_id UUID NOT NULL REFERENCES users(id),
    completion_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    payment_amount DECIMAL(10,2),
    is_vip_job BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(job_id, worker_id)
);

-- Insert default achievement levels
INSERT INTO referral_achievements (name, description, vip_requirement, reward_amount) VALUES
('Bronze VIP Referrer', 'Refer 5 VIP users and earn extra bonus', 5, 0.10),
('Gold VIP Referrer', 'Refer 50 VIP users and earn extra bonus', 50, 0.50)
ON CONFLICT DO NOTHING;

-- Insert default commission settings
INSERT INTO referral_commission_settings (
    setting_name, 
    normal_refer_rate, 
    vip_refer_rate, 
    first_deposit_commission, 
    microjob_commission, 
    service_commission
) VALUES (
    'default',
    0.0050, -- $0.005 for normal referrals
    0.0500, -- $0.05 for VIP referrals
    5.00,   -- 5% commission on first deposit
    2.00,   -- 2% commission on microjob earnings
    2.00    -- 2% commission on service purchases
) ON CONFLICT (setting_name) DO UPDATE SET
    normal_refer_rate = EXCLUDED.normal_refer_rate,
    vip_refer_rate = EXCLUDED.vip_refer_rate,
    first_deposit_commission = EXCLUDED.first_deposit_commission,
    microjob_commission = EXCLUDED.microjob_commission,
    service_commission = EXCLUDED.service_commission,
    updated_at = NOW();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_vip_jobs_job_id ON vip_jobs(job_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_vip ON referrals(referrer_id, is_vip);
CREATE INDEX IF NOT EXISTS idx_user_achievement_requests_user_status ON user_achievement_requests(user_id, status);
CREATE INDEX IF NOT EXISTS idx_referral_commissions_referrer ON referral_commissions(referrer_id, status);
CREATE INDEX IF NOT EXISTS idx_user_deposits_user_first ON user_deposits(user_id, is_first_deposit);
CREATE INDEX IF NOT EXISTS idx_job_completions_worker_vip ON job_completions(worker_id, is_vip_job);
