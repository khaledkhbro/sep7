-- Create admin_settings table for persistent admin configuration
CREATE TABLE IF NOT EXISTS admin_settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(255) UNIQUE NOT NULL,
    setting_value JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_admin_settings_key ON admin_settings(setting_key);

-- Insert default revision settings if they don't exist
INSERT INTO admin_settings (setting_key, setting_value) 
VALUES (
    'revision_settings',
    '{
        "maxRevisionRequests": 2,
        "workerResponseTimeoutValue": 24,
        "workerResponseTimeoutUnit": "hours",
        "enableRevisionWarnings": true,
        "revisionPenaltyEnabled": false,
        "revisionPenaltyAmount": 0
    }'::jsonb
) ON CONFLICT (setting_key) DO NOTHING;
