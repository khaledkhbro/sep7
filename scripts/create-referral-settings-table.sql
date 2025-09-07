-- Create referral_settings table for admin configuration
CREATE TABLE IF NOT EXISTS referral_settings (
    id SERIAL PRIMARY KEY,
    
    -- Commission Settings
    first_deposit_commission DECIMAL(5,2) DEFAULT 5.0,
    first_deposit_commission_enabled BOOLEAN DEFAULT true,
    first_purchase_commission DECIMAL(5,2) DEFAULT 1.0,
    first_purchase_commission_enabled BOOLEAN DEFAULT true,
    first_purchase_period_value INTEGER DEFAULT 3,
    first_purchase_period_unit VARCHAR(20) DEFAULT 'days',
    microjob_work_bonus DECIMAL(5,2) DEFAULT 2.0,
    microjob_work_bonus_enabled BOOLEAN DEFAULT true,
    sign_up_bonus DECIMAL(10,6) DEFAULT 0.005,
    sign_up_bonus_enabled BOOLEAN DEFAULT true,
    lifetime_commission_min DECIMAL(5,2) DEFAULT 0.05,
    lifetime_commission_max DECIMAL(5,2) DEFAULT 20.0,
    lifetime_commission_enabled BOOLEAN DEFAULT true,
    
    -- Page Content
    refer_page_title VARCHAR(255) DEFAULT 'Vip Refer',
    refer_page_text TEXT DEFAULT '* Every Successfully Vip Refer For You Earn $

* To Become a Vip Refer * Refer Have To Complete 3 Job ✅ Or

* Refer have to Deposit Any Amount ✅

* Every refers and Vip Refer from You get lifetime commission it''s can be ( 0.05-20% )✅',
    
    -- System Settings
    status BOOLEAN DEFAULT true,
    require_job_completion BOOLEAN DEFAULT true,
    require_deposit BOOLEAN DEFAULT false,
    min_jobs_for_vip INTEGER DEFAULT 3,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default settings if table is empty
INSERT INTO referral_settings (
    first_deposit_commission, first_deposit_commission_enabled,
    first_purchase_commission, first_purchase_commission_enabled,
    first_purchase_period_value, first_purchase_period_unit,
    microjob_work_bonus, microjob_work_bonus_enabled,
    sign_up_bonus, sign_up_bonus_enabled,
    lifetime_commission_min, lifetime_commission_max, lifetime_commission_enabled,
    refer_page_title, refer_page_text,
    status, require_job_completion, require_deposit, min_jobs_for_vip
) 
SELECT 5.0, true, 1.0, true, 3, 'days', 2.0, true, 0.005, true, 0.05, 20.0, true,
       'Vip Refer', '* Every Successfully Vip Refer For You Earn $

* To Become a Vip Refer * Refer Have To Complete 3 Job ✅ Or

* Refer have to Deposit Any Amount ✅

* Every refers and Vip Refer from You get lifetime commission it''s can be ( 0.05-20% )✅',
       true, true, false, 3
WHERE NOT EXISTS (SELECT 1 FROM referral_settings);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_referral_settings_updated_at ON referral_settings(updated_at DESC);
