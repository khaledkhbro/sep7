-- Analytics Configuration Tables
-- This script creates tables for storing analytics and tracking configurations

-- Analytics providers configuration
CREATE TABLE IF NOT EXISTS analytics_providers (
    id SERIAL PRIMARY KEY,
    provider_name VARCHAR(50) NOT NULL UNIQUE,
    enabled BOOLEAN DEFAULT false,
    configuration JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Analytics settings for the platform
CREATE TABLE IF NOT EXISTS analytics_settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT,
    setting_type VARCHAR(20) DEFAULT 'string', -- string, boolean, number, json
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Analytics events tracking
CREATE TABLE IF NOT EXISTS analytics_events (
    id SERIAL PRIMARY KEY,
    event_name VARCHAR(100) NOT NULL,
    event_category VARCHAR(50),
    event_action VARCHAR(50),
    event_label VARCHAR(100),
    event_value DECIMAL(10,2),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    session_id VARCHAR(100),
    page_url TEXT,
    referrer TEXT,
    user_agent TEXT,
    ip_address INET,
    country_code VARCHAR(2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_name ON analytics_events(event_name);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_events_session_id ON analytics_events(session_id);

-- Insert default analytics settings
INSERT INTO analytics_settings (setting_key, setting_value, setting_type, description) VALUES
('ga4_enabled', 'false', 'boolean', 'Enable Google Analytics 4 tracking'),
('ga4_measurement_id', '', 'string', 'Google Analytics 4 Measurement ID'),
('ga4_stream_id', '', 'string', 'Google Analytics 4 Data Stream ID'),
('gtm_enabled', 'false', 'boolean', 'Enable Google Tag Manager'),
('gtm_container_id', '', 'string', 'Google Tag Manager Container ID'),
('facebook_pixel_enabled', 'false', 'boolean', 'Enable Facebook Pixel tracking'),
('facebook_pixel_id', '', 'string', 'Facebook Pixel ID'),
('custom_analytics_enabled', 'false', 'boolean', 'Enable custom analytics scripts'),
('custom_head_scripts', '', 'string', 'Custom scripts for HTML head section'),
('custom_body_scripts', '', 'string', 'Custom scripts for HTML body section'),
('analytics_cookie_consent', 'true', 'boolean', 'Require cookie consent for analytics'),
('analytics_anonymize_ip', 'true', 'boolean', 'Anonymize IP addresses in analytics'),
('analytics_respect_dnt', 'true', 'boolean', 'Respect Do Not Track browser settings')
ON CONFLICT (setting_key) DO NOTHING;

-- Function to get analytics settings
CREATE OR REPLACE FUNCTION get_analytics_settings()
RETURNS TABLE (
    setting_key VARCHAR(100),
    setting_value TEXT,
    setting_type VARCHAR(20)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.setting_key,
        a.setting_value,
        a.setting_type
    FROM analytics_settings a
    ORDER BY a.setting_key;
END;
$$ LANGUAGE plpgsql;

-- Function to update analytics setting
CREATE OR REPLACE FUNCTION update_analytics_setting(
    p_setting_key VARCHAR(100),
    p_setting_value TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE analytics_settings 
    SET 
        setting_value = p_setting_value,
        updated_at = NOW()
    WHERE setting_key = p_setting_key;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Function to track analytics event
CREATE OR REPLACE FUNCTION track_analytics_event(
    p_event_name VARCHAR(100),
    p_event_category VARCHAR(50) DEFAULT NULL,
    p_event_action VARCHAR(50) DEFAULT NULL,
    p_event_label VARCHAR(100) DEFAULT NULL,
    p_event_value DECIMAL(10,2) DEFAULT NULL,
    p_user_id UUID DEFAULT NULL,
    p_session_id VARCHAR(100) DEFAULT NULL,
    p_page_url TEXT DEFAULT NULL,
    p_referrer TEXT DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_ip_address INET DEFAULT NULL,
    p_country_code VARCHAR(2) DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    event_id UUID;
BEGIN
    INSERT INTO analytics_events (
        event_name, event_category, event_action, event_label, event_value,
        user_id, session_id, page_url, referrer, user_agent, ip_address, country_code
    ) VALUES (
        p_event_name, p_event_category, p_event_action, p_event_label, p_event_value,
        p_user_id, p_session_id, p_page_url, p_referrer, p_user_agent, p_ip_address, p_country_code
    ) RETURNING id INTO event_id;
    
    RETURN event_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get analytics summary
CREATE OR REPLACE FUNCTION get_analytics_summary(
    p_start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() - INTERVAL '30 days',
    p_end_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS TABLE (
    total_events BIGINT,
    unique_users BIGINT,
    unique_sessions BIGINT,
    top_events JSON
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_events,
        COUNT(DISTINCT user_id) as unique_users,
        COUNT(DISTINCT session_id) as unique_sessions,
        (
            SELECT json_agg(
                json_build_object(
                    'event_name', event_name,
                    'count', event_count
                )
            )
            FROM (
                SELECT 
                    event_name,
                    COUNT(*) as event_count
                FROM analytics_events 
                WHERE created_at BETWEEN p_start_date AND p_end_date
                GROUP BY event_name
                ORDER BY event_count DESC
                LIMIT 10
            ) top_events_subquery
        ) as top_events
    FROM analytics_events 
    WHERE created_at BETWEEN p_start_date AND p_end_date;
END;
$$ LANGUAGE plpgsql;
