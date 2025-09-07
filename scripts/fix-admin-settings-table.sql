-- Fix missing admin_settings table issue
-- This script ensures the admin_settings table exists and has the correct structure

-- Drop and recreate the admin_settings table to ensure it exists
DROP TABLE IF EXISTS admin_settings CASCADE;

-- Create admin_settings table for persistent admin configuration
CREATE TABLE admin_settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(255) UNIQUE NOT NULL,
    setting_value JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX idx_admin_settings_key ON admin_settings(setting_key);

-- Insert default revision settings
INSERT INTO admin_settings (setting_key, setting_value) 
VALUES (
    'revision_settings',
    '{
        "maxRevisionRequests": 2,
        "revisionRequestTimeoutValue": 24,
        "revisionRequestTimeoutUnit": "hours",
        "rejectionResponseTimeoutValue": 24,
        "rejectionResponseTimeoutUnit": "hours",
        "enableAutomaticRefunds": true,
        "refundOnRevisionTimeout": true,
        "refundOnRejectionTimeout": true,
        "enableRevisionWarnings": true,
        "revisionPenaltyEnabled": false,
        "revisionPenaltyAmount": 0
    }'::jsonb
) ON CONFLICT (setting_key) DO NOTHING;

-- Verify the table was created successfully
SELECT 'admin_settings table created successfully' as status;
SELECT COUNT(*) as revision_settings_count FROM admin_settings WHERE setting_key = 'revision_settings';
