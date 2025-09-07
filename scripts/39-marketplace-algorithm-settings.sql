-- Create marketplace algorithm settings table
CREATE TABLE IF NOT EXISTS marketplace_algorithm_settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value JSONB NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create promoted services table
CREATE TABLE IF NOT EXISTS promoted_services (
    id SERIAL PRIMARY KEY,
    service_id INTEGER REFERENCES marketplace_services(id),
    position INTEGER NOT NULL,
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create user behavior tracking table
CREATE TABLE IF NOT EXISTS user_behavior_tracking (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    service_id INTEGER REFERENCES marketplace_services(id),
    action_type VARCHAR(50) NOT NULL, -- 'view', 'click', 'purchase', 'favorite'
    session_id VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    referrer TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create marketplace analytics table
CREATE TABLE IF NOT EXISTS marketplace_analytics (
    id SERIAL PRIMARY KEY,
    service_id INTEGER REFERENCES marketplace_services(id),
    date DATE NOT NULL,
    views INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    orders INTEGER DEFAULT 0,
    revenue DECIMAL(10,2) DEFAULT 0,
    conversion_rate DECIMAL(5,4) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(service_id, date)
);

-- Insert default algorithm settings
INSERT INTO marketplace_algorithm_settings (setting_key, setting_value, description) VALUES
('algorithm_weights', '{
    "popular": {"weight": 25, "enabled": true},
    "bought": {"weight": 30, "enabled": true},
    "clicked": {"weight": 20, "enabled": true},
    "viewed": {"weight": 15, "enabled": true},
    "reviewed": {"weight": 20, "enabled": true},
    "fast_delivery": {"weight": 10, "enabled": true}
}', 'Algorithm weights for service ranking'),
('page_settings', '{
    "servicesPerPage": 20,
    "featuredServicesCount": 6,
    "categoriesOnFirstPage": 8,
    "enablePersonalization": true,
    "enableBrowsingHistory": true,
    "enableSimilarServices": true,
    "recommendationCount": 12
}', 'Page display and personalization settings'),
('recommendation_weights', '{
    "sameCategory": 40,
    "browsingHistory": 30,
    "similarBuyers": 20,
    "priceRange": 10
}', 'Recommendation engine weights');

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_behavior_user_id ON user_behavior_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_user_behavior_service_id ON user_behavior_tracking(service_id);
CREATE INDEX IF NOT EXISTS idx_user_behavior_action_type ON user_behavior_tracking(action_type);
CREATE INDEX IF NOT EXISTS idx_user_behavior_created_at ON user_behavior_tracking(created_at);
CREATE INDEX IF NOT EXISTS idx_promoted_services_enabled ON promoted_services(enabled);
CREATE INDEX IF NOT EXISTS idx_promoted_services_dates ON promoted_services(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_marketplace_analytics_service_date ON marketplace_analytics(service_id, date);
