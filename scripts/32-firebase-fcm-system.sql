-- Firebase FCM tokens for push notifications
CREATE TABLE fcm_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token TEXT NOT NULL,
    device_type VARCHAR(20) DEFAULT 'web', -- 'web', 'android', 'ios'
    device_info JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, token)
);

-- User notification preferences
CREATE TABLE user_notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    -- Email notifications
    email_notifications BOOLEAN DEFAULT TRUE,
    job_alerts BOOLEAN DEFAULT TRUE,
    message_notifications BOOLEAN DEFAULT TRUE,
    marketing_emails BOOLEAN DEFAULT FALSE,
    weekly_digest BOOLEAN DEFAULT TRUE,
    -- Push notifications
    push_notifications BOOLEAN DEFAULT TRUE,
    push_job_updates BOOLEAN DEFAULT TRUE,
    push_messages BOOLEAN DEFAULT TRUE,
    push_payments BOOLEAN DEFAULT TRUE,
    push_referrals BOOLEAN DEFAULT TRUE,
    push_system_alerts BOOLEAN DEFAULT TRUE,
    push_marketing BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Firebase admin settings
CREATE TABLE firebase_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    is_encrypted BOOLEAN DEFAULT FALSE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default Firebase settings
INSERT INTO firebase_settings (setting_key, setting_value, description) VALUES
('fcm_enabled', 'false', 'Enable/disable Firebase Cloud Messaging'),
('firebase_project_id', '', 'Firebase project ID'),
('firebase_private_key', '', 'Firebase service account private key (encrypted)'),
('firebase_client_email', '', 'Firebase service account client email'),
('fcm_web_config', '{}', 'Firebase web app configuration JSON'),
('fcm_default_icon', '/icon-192x192.png', 'Default notification icon'),
('fcm_default_badge', '/badge-72x72.png', 'Default notification badge');

-- Push notification logs
CREATE TABLE push_notification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    notification_id UUID REFERENCES notifications(id),
    fcm_token TEXT,
    title VARCHAR(255),
    body TEXT,
    status VARCHAR(20) DEFAULT 'sent', -- 'sent', 'delivered', 'failed'
    error_message TEXT,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_fcm_tokens_user_id ON fcm_tokens(user_id);
CREATE INDEX idx_fcm_tokens_active ON fcm_tokens(is_active);
CREATE INDEX idx_user_notification_preferences_user_id ON user_notification_preferences(user_id);
CREATE INDEX idx_push_notification_logs_user_id ON push_notification_logs(user_id);
CREATE INDEX idx_push_notification_logs_sent_at ON push_notification_logs(sent_at);
