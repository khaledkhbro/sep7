-- Ensure support_pricing_settings table exists with all required data
-- This script can be run safely multiple times

CREATE TABLE IF NOT EXISTS support_pricing_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    support_type VARCHAR(20) NOT NULL UNIQUE,
    price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    response_time_hours INTEGER NOT NULL DEFAULT 24,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default support pricing if not exists
INSERT INTO support_pricing_settings (support_type, price, response_time_hours, description, is_active)
VALUES 
    ('free', 0.00, 48, 'Standard support with 24-48 hour response time', true),
    ('priority', 0.50, 2, 'Priority support with 1-2 hour response time', true),
    ('urgent', 1.00, 1, 'Urgent support with response within 1 hour', true)
ON CONFLICT (support_type) DO UPDATE SET
    updated_at = NOW();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_support_pricing_settings_support_type ON support_pricing_settings(support_type);
CREATE INDEX IF NOT EXISTS idx_support_pricing_settings_is_active ON support_pricing_settings(is_active);

-- Verify the table was created successfully
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'support_pricing_settings') THEN
        RAISE NOTICE 'support_pricing_settings table created successfully';
    ELSE
        RAISE EXCEPTION 'Failed to create support_pricing_settings table';
    END IF;
END $$;
