-- Create platform fee settings table
CREATE TABLE IF NOT EXISTS platform_fee_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fee_type VARCHAR(50) NOT NULL UNIQUE, -- 'job_platform_fee'
  fee_percentage DECIMAL(5,2) NOT NULL DEFAULT 5.00, -- 5.00%
  fee_fixed DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  minimum_fee DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  maximum_fee DECIMAL(10,2) NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default platform fee setting
INSERT INTO platform_fee_settings (fee_type, fee_percentage, fee_fixed, minimum_fee, is_active)
VALUES ('job_platform_fee', 5.00, 0.00, 0.00, true)
ON CONFLICT (fee_type) DO NOTHING;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_platform_fee_settings_fee_type ON platform_fee_settings(fee_type);
CREATE INDEX IF NOT EXISTS idx_platform_fee_settings_active ON platform_fee_settings(is_active);
