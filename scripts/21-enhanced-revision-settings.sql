-- Update admin_settings table with enhanced revision settings
UPDATE admin_settings 
SET setting_value = jsonb_set(
    jsonb_set(
        jsonb_set(
            jsonb_set(
                jsonb_set(
                    jsonb_set(
                        setting_value,
                        '{revisionRequestTimeoutValue}',
                        COALESCE(setting_value->'workerResponseTimeoutValue', '24')
                    ),
                    '{revisionRequestTimeoutUnit}',
                    COALESCE(setting_value->'workerResponseTimeoutUnit', '"hours"')
                ),
                '{rejectionResponseTimeoutValue}',
                COALESCE(setting_value->'workerResponseTimeoutValue', '24')
            ),
            '{rejectionResponseTimeoutUnit}',
            COALESCE(setting_value->'workerResponseTimeoutUnit', '"hours"')
        ),
        '{enableAutomaticRefunds}',
        'true'
    ),
    '{refundOnRevisionTimeout}',
    'true'
),
setting_value = jsonb_set(
    setting_value,
    '{refundOnRejectionTimeout}',
    'true'
),
updated_at = NOW()
WHERE setting_key = 'revision_settings';

-- Insert enhanced revision settings if they don't exist
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
