-- Create screenshot pricing configuration system for admin control
-- This allows admins to set dynamic pricing for screenshot requirements

-- Create screenshot pricing settings table
CREATE TABLE IF NOT EXISTS screenshot_pricing_settings (
    id SERIAL PRIMARY KEY,
    setting_name VARCHAR(100) NOT NULL UNIQUE,
    setting_value DECIMAL(10,4) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create screenshot pricing tiers table for different screenshot counts
CREATE TABLE IF NOT EXISTS screenshot_pricing_tiers (
    id SERIAL PRIMARY KEY,
    screenshot_number INTEGER NOT NULL, -- 1st, 2nd, 3rd, etc.
    percentage_fee DECIMAL(5,2) NOT NULL, -- Percentage of total job cost
    is_free BOOLEAN DEFAULT false, -- If this tier is free
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(screenshot_number)
);

-- Insert default screenshot pricing settings
INSERT INTO screenshot_pricing_settings (setting_name, setting_value, description) VALUES
('max_screenshots_allowed', 5, 'Maximum number of screenshots that can be requested per job'),
('default_screenshot_fee', 0.05, 'Default flat fee per screenshot (fallback if percentage system disabled)'),
('enable_percentage_pricing', 1, 'Enable percentage-based pricing (1) or use flat fee (0)'),
('platform_screenshot_fee', 0, 'Additional platform fee for screenshot processing')
ON CONFLICT (setting_name) DO NOTHING;

-- Insert default screenshot pricing tiers
INSERT INTO screenshot_pricing_tiers (screenshot_number, percentage_fee, is_free) VALUES
(1, 0.00, true),   -- 1st screenshot free by default
(2, 3.00, false),  -- 2nd screenshot 3% of job cost
(3, 3.00, false),  -- 3rd screenshot 3% of job cost  
(4, 5.00, false),  -- 4th screenshot 5% of job cost
(5, 5.00, false)   -- 5th screenshot 5% of job cost
ON CONFLICT (screenshot_number) DO NOTHING;

-- Create function to update timestamp
CREATE OR REPLACE FUNCTION update_screenshot_pricing_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
DROP TRIGGER IF EXISTS update_screenshot_pricing_settings_timestamp ON screenshot_pricing_settings;
CREATE TRIGGER update_screenshot_pricing_settings_timestamp
    BEFORE UPDATE ON screenshot_pricing_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_screenshot_pricing_timestamp();

DROP TRIGGER IF EXISTS update_screenshot_pricing_tiers_timestamp ON screenshot_pricing_tiers;
CREATE TRIGGER update_screenshot_pricing_tiers_timestamp
    BEFORE UPDATE ON screenshot_pricing_tiers
    FOR EACH ROW
    EXECUTE FUNCTION update_screenshot_pricing_timestamp();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_screenshot_pricing_settings_active ON screenshot_pricing_settings(is_active);
CREATE INDEX IF NOT EXISTS idx_screenshot_pricing_settings_name ON screenshot_pricing_settings(setting_name);
CREATE INDEX IF NOT EXISTS idx_screenshot_pricing_tiers_active ON screenshot_pricing_tiers(is_active);
CREATE INDEX IF NOT EXISTS idx_screenshot_pricing_tiers_number ON screenshot_pricing_tiers(screenshot_number);

-- Add audit logging for screenshot pricing changes
CREATE TABLE IF NOT EXISTS screenshot_pricing_audit (
    id SERIAL PRIMARY KEY,
    table_name VARCHAR(50) NOT NULL,
    record_id INTEGER NOT NULL,
    action VARCHAR(10) NOT NULL, -- INSERT, UPDATE, DELETE
    old_values JSONB,
    new_values JSONB,
    changed_by VARCHAR(255),
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create audit trigger function
CREATE OR REPLACE FUNCTION audit_screenshot_pricing_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        INSERT INTO screenshot_pricing_audit (table_name, record_id, action, old_values, changed_at)
        VALUES (TG_TABLE_NAME, OLD.id, 'DELETE', row_to_json(OLD), CURRENT_TIMESTAMP);
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO screenshot_pricing_audit (table_name, record_id, action, old_values, new_values, changed_at)
        VALUES (TG_TABLE_NAME, NEW.id, 'UPDATE', row_to_json(OLD), row_to_json(NEW), CURRENT_TIMESTAMP);
        RETURN NEW;
    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO screenshot_pricing_audit (table_name, record_id, action, new_values, changed_at)
        VALUES (TG_TABLE_NAME, NEW.id, 'INSERT', row_to_json(NEW), CURRENT_TIMESTAMP);
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create audit triggers
DROP TRIGGER IF EXISTS audit_screenshot_pricing_settings ON screenshot_pricing_settings;
CREATE TRIGGER audit_screenshot_pricing_settings
    AFTER INSERT OR UPDATE OR DELETE ON screenshot_pricing_settings
    FOR EACH ROW EXECUTE FUNCTION audit_screenshot_pricing_changes();

DROP TRIGGER IF EXISTS audit_screenshot_pricing_tiers ON screenshot_pricing_tiers;
CREATE TRIGGER audit_screenshot_pricing_tiers
    AFTER INSERT OR UPDATE OR DELETE ON screenshot_pricing_tiers
    FOR EACH ROW EXECUTE FUNCTION audit_screenshot_pricing_changes();

-- Create view for easy screenshot pricing calculation
CREATE OR REPLACE VIEW screenshot_pricing_summary AS
SELECT 
    spt.screenshot_number,
    spt.percentage_fee,
    spt.is_free,
    spt.is_active,
    (SELECT setting_value FROM screenshot_pricing_settings WHERE setting_name = 'max_screenshots_allowed') as max_screenshots,
    (SELECT setting_value FROM screenshot_pricing_settings WHERE setting_name = 'enable_percentage_pricing') as percentage_pricing_enabled
FROM screenshot_pricing_tiers spt
WHERE spt.is_active = true
ORDER BY spt.screenshot_number;

COMMENT ON TABLE screenshot_pricing_settings IS 'Global settings for screenshot pricing system';
COMMENT ON TABLE screenshot_pricing_tiers IS 'Pricing tiers for different screenshot counts';
COMMENT ON TABLE screenshot_pricing_audit IS 'Audit log for screenshot pricing changes';
COMMENT ON VIEW screenshot_pricing_summary IS 'Summary view for screenshot pricing calculation';
