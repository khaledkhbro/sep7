-- Create ad network settings table
CREATE TABLE IF NOT EXISTS ad_network_settings (
    id SERIAL PRIMARY KEY,
    network_name VARCHAR(50) NOT NULL UNIQUE,
    is_enabled BOOLEAN DEFAULT false,
    publisher_id VARCHAR(255),
    site_id VARCHAR(255),
    zone_id VARCHAR(255),
    api_key VARCHAR(255),
    script_code TEXT,
    auto_ads_code TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create ad placement settings table
CREATE TABLE IF NOT EXISTS ad_placement_settings (
    id SERIAL PRIMARY KEY,
    placement_name VARCHAR(50) NOT NULL UNIQUE,
    is_enabled BOOLEAN DEFAULT false,
    priority INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create ad performance tracking table
CREATE TABLE IF NOT EXISTS ad_performance (
    id SERIAL PRIMARY KEY,
    network_name VARCHAR(50) NOT NULL,
    placement_name VARCHAR(50) NOT NULL,
    impressions INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    revenue DECIMAL(10,2) DEFAULT 0.00,
    date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (network_name) REFERENCES ad_network_settings(network_name) ON DELETE CASCADE,
    FOREIGN KEY (placement_name) REFERENCES ad_placement_settings(placement_name) ON DELETE CASCADE,
    UNIQUE(network_name, placement_name, date)
);

-- Insert default ad network configurations
INSERT INTO ad_network_settings (network_name, is_enabled) VALUES
('adsense', false),
('ezoic', false),
('propellerads', false),
('adsterra', false)
ON CONFLICT (network_name) DO NOTHING;

-- Insert default ad placement settings
INSERT INTO ad_placement_settings (placement_name, is_enabled, priority) VALUES
('header', false, 1),
('sidebar', false, 2),
('footer', false, 3),
('content', false, 4)
ON CONFLICT (placement_name) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ad_network_settings_enabled ON ad_network_settings(is_enabled);
CREATE INDEX IF NOT EXISTS idx_ad_placement_settings_enabled ON ad_placement_settings(is_enabled);
CREATE INDEX IF NOT EXISTS idx_ad_performance_date ON ad_performance(date);
CREATE INDEX IF NOT EXISTS idx_ad_performance_network ON ad_performance(network_name);

-- Create function to update ad network settings
CREATE OR REPLACE FUNCTION update_ad_network_setting(
    p_network_name VARCHAR(50),
    p_is_enabled BOOLEAN DEFAULT NULL,
    p_publisher_id VARCHAR(255) DEFAULT NULL,
    p_site_id VARCHAR(255) DEFAULT NULL,
    p_zone_id VARCHAR(255) DEFAULT NULL,
    p_api_key VARCHAR(255) DEFAULT NULL,
    p_script_code TEXT DEFAULT NULL,
    p_auto_ads_code TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE ad_network_settings 
    SET 
        is_enabled = COALESCE(p_is_enabled, is_enabled),
        publisher_id = COALESCE(p_publisher_id, publisher_id),
        site_id = COALESCE(p_site_id, site_id),
        zone_id = COALESCE(p_zone_id, zone_id),
        api_key = COALESCE(p_api_key, api_key),
        script_code = COALESCE(p_script_code, script_code),
        auto_ads_code = COALESCE(p_auto_ads_code, auto_ads_code),
        updated_at = CURRENT_TIMESTAMP
    WHERE network_name = p_network_name;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Create function to update ad placement settings
CREATE OR REPLACE FUNCTION update_ad_placement_setting(
    p_placement_name VARCHAR(50),
    p_is_enabled BOOLEAN DEFAULT NULL,
    p_priority INTEGER DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE ad_placement_settings 
    SET 
        is_enabled = COALESCE(p_is_enabled, is_enabled),
        priority = COALESCE(p_priority, priority),
        updated_at = CURRENT_TIMESTAMP
    WHERE placement_name = p_placement_name;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Create function to get enabled ad networks
CREATE OR REPLACE FUNCTION get_enabled_ad_networks()
RETURNS TABLE(
    network_name VARCHAR(50),
    publisher_id VARCHAR(255),
    site_id VARCHAR(255),
    zone_id VARCHAR(255),
    api_key VARCHAR(255),
    script_code TEXT,
    auto_ads_code TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ans.network_name,
        ans.publisher_id,
        ans.site_id,
        ans.zone_id,
        ans.api_key,
        ans.script_code,
        ans.auto_ads_code
    FROM ad_network_settings ans
    WHERE ans.is_enabled = true
    ORDER BY ans.network_name;
END;
$$ LANGUAGE plpgsql;

-- Create function to get enabled ad placements
CREATE OR REPLACE FUNCTION get_enabled_ad_placements()
RETURNS TABLE(
    placement_name VARCHAR(50),
    priority INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        aps.placement_name,
        aps.priority
    FROM ad_placement_settings aps
    WHERE aps.is_enabled = true
    ORDER BY aps.priority;
END;
$$ LANGUAGE plpgsql;

-- Create function to record ad performance
CREATE OR REPLACE FUNCTION record_ad_performance(
    p_network_name VARCHAR(50),
    p_placement_name VARCHAR(50),
    p_impressions INTEGER DEFAULT 0,
    p_clicks INTEGER DEFAULT 0,
    p_revenue DECIMAL(10,2) DEFAULT 0.00,
    p_date DATE DEFAULT CURRENT_DATE
)
RETURNS BOOLEAN AS $$
BEGIN
    INSERT INTO ad_performance (network_name, placement_name, impressions, clicks, revenue, date)
    VALUES (p_network_name, p_placement_name, p_impressions, p_clicks, p_revenue, p_date)
    ON CONFLICT (network_name, placement_name, date)
    DO UPDATE SET
        impressions = ad_performance.impressions + p_impressions,
        clicks = ad_performance.clicks + p_clicks,
        revenue = ad_performance.revenue + p_revenue;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Create function to get ad performance stats
CREATE OR REPLACE FUNCTION get_ad_performance_stats(
    p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
    p_end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE(
    network_name VARCHAR(50),
    placement_name VARCHAR(50),
    total_impressions BIGINT,
    total_clicks BIGINT,
    total_revenue DECIMAL(10,2),
    ctr DECIMAL(5,4),
    avg_revenue_per_click DECIMAL(10,4)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ap.network_name,
        ap.placement_name,
        SUM(ap.impressions) as total_impressions,
        SUM(ap.clicks) as total_clicks,
        SUM(ap.revenue) as total_revenue,
        CASE 
            WHEN SUM(ap.impressions) > 0 THEN 
                ROUND((SUM(ap.clicks)::DECIMAL / SUM(ap.impressions)::DECIMAL) * 100, 4)
            ELSE 0
        END as ctr,
        CASE 
            WHEN SUM(ap.clicks) > 0 THEN 
                ROUND(SUM(ap.revenue) / SUM(ap.clicks), 4)
            ELSE 0
        END as avg_revenue_per_click
    FROM ad_performance ap
    WHERE ap.date BETWEEN p_start_date AND p_end_date
    GROUP BY ap.network_name, ap.placement_name
    ORDER BY total_revenue DESC;
END;
$$ LANGUAGE plpgsql;
