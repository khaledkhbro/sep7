-- Create database tables for referral system
CREATE TABLE IF NOT EXISTS achievements (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  referral_type VARCHAR(20) DEFAULT 'vip',
  referral_requirement INTEGER NOT NULL,
  reward_amount DECIMAL(10,2) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS achievement_requests (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  achievement_id INTEGER NOT NULL REFERENCES achievements(id),
  vip_referrals_count INTEGER NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  processed_at TIMESTAMP,
  processed_by VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS referral_settings (
  id SERIAL PRIMARY KEY DEFAULT 1,
  first_deposit_commission DECIMAL(5,2) DEFAULT 5.0,
  first_deposit_commission_enabled BOOLEAN DEFAULT true,
  first_purchase_commission DECIMAL(5,2) DEFAULT 1.0,
  first_purchase_commission_enabled BOOLEAN DEFAULT true,
  first_purchase_period_value INTEGER DEFAULT 3,
  first_purchase_period_unit VARCHAR(20) DEFAULT 'days',
  microjob_work_bonus DECIMAL(5,2) DEFAULT 2.0,
  microjob_work_bonus_enabled BOOLEAN DEFAULT true,
  sign_up_bonus DECIMAL(10,3) DEFAULT 0.005,
  sign_up_bonus_enabled BOOLEAN DEFAULT true,
  lifetime_commission_min DECIMAL(5,2) DEFAULT 0.05,
  lifetime_commission_max DECIMAL(5,2) DEFAULT 20.0,
  lifetime_commission_enabled BOOLEAN DEFAULT true,
  refer_page_title VARCHAR(255) DEFAULT 'Vip Refer',
  refer_page_text TEXT,
  status BOOLEAN DEFAULT true,
  require_job_completion BOOLEAN DEFAULT true,
  require_deposit BOOLEAN DEFAULT false,
  min_jobs_for_vip INTEGER DEFAULT 3,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT single_settings CHECK (id = 1)
);

CREATE TABLE IF NOT EXISTS referrals (
  id SERIAL PRIMARY KEY,
  referrer_id INTEGER NOT NULL,
  referred_user_id INTEGER NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  is_vip BOOLEAN DEFAULT false,
  vip_method VARCHAR(50),
  vip_achieved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_achievement_requests_user_id ON achievement_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_achievement_requests_status ON achievement_requests(status);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);
