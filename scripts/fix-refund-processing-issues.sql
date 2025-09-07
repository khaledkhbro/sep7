-- Fix refund processing issues by ensuring admin_settings table exists and has proper data
-- This script addresses the root cause of refund processing failures

-- Ensure admin_settings table exists (should already be created by previous scripts)
CREATE TABLE IF NOT EXISTS admin_settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(255) UNIQUE NOT NULL,
    setting_value JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert or update revision settings with automatic refunds enabled
INSERT INTO admin_settings (setting_key, setting_value, updated_at)
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
        "revisionPenaltyAmount": 0,
        "updated_at": "' || NOW()::text || '"
    }'::jsonb,
    NOW()
)
ON CONFLICT (setting_key) 
DO UPDATE SET 
    setting_value = EXCLUDED.setting_value,
    updated_at = EXCLUDED.updated_at;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_admin_settings_key ON admin_settings(setting_key);

-- Verify the settings were inserted correctly
SELECT setting_key, setting_value FROM admin_settings WHERE setting_key = 'revision_settings';
