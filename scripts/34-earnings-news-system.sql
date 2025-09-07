-- Create earnings news system with raw PostgreSQL
-- This system allows admins to post earning-related news with country targeting

-- Create earnings_news table
CREATE TABLE IF NOT EXISTS earnings_news (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    thumbnail TEXT NOT NULL,
    description TEXT NOT NULL,
    money DECIMAL(10,2) NOT NULL,
    countries TEXT[], -- Array of country codes, NULL means global
    status BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_earnings_news_status ON earnings_news(status);
CREATE INDEX IF NOT EXISTS idx_earnings_news_created_at ON earnings_news(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_earnings_news_countries ON earnings_news USING GIN(countries);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_earnings_news_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER earnings_news_updated_at_trigger
    BEFORE UPDATE ON earnings_news
    FOR EACH ROW
    EXECUTE FUNCTION update_earnings_news_updated_at();

-- Insert sample data for testing
INSERT INTO earnings_news (title, thumbnail, description, money, countries, status) VALUES
('Global Earnings Boost', '/placeholder.svg?height=200&width=300', 'Great news! Our platform has seen a 25% increase in average earnings this month. This applies to all users worldwide.', 250.00, NULL, true),
('US Market Expansion', '/placeholder.svg?height=200&width=300', 'Exciting opportunities for US-based freelancers with new enterprise clients joining our platform.', 500.00, ARRAY['US'], true),
('European Premium Program', '/placeholder.svg?height=200&width=300', 'Launch of premium tier services in European markets with higher earning potential.', 750.00, ARRAY['DE', 'FR', 'UK', 'IT', 'ES'], true),
('Asia-Pacific Growth', '/placeholder.svg?height=200&width=300', 'Significant market expansion in Asia-Pacific region bringing new high-value projects.', 400.00, ARRAY['JP', 'AU', 'SG', 'HK'], true),
('Q4 Bonus Program', '/placeholder.svg?height=200&width=300', 'Special Q4 bonus program for top performers. Limited time offer with exclusive benefits.', 1000.00, NULL, true);

-- Create function to get earnings news with country filtering
CREATE OR REPLACE FUNCTION get_earnings_news_for_user(
    user_country TEXT DEFAULT NULL,
    page_offset INTEGER DEFAULT 0,
    page_limit INTEGER DEFAULT 5
)
RETURNS TABLE (
    id UUID,
    title TEXT,
    thumbnail TEXT,
    description TEXT,
    money DECIMAL,
    countries TEXT[],
    created_at TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        en.id,
        en.title,
        en.thumbnail,
        en.description,
        en.money,
        en.countries,
        en.created_at
    FROM earnings_news en
    WHERE en.status = true
    AND (
        en.countries IS NULL 
        OR user_country IS NULL 
        OR user_country = ANY(en.countries)
    )
    ORDER BY en.created_at DESC
    LIMIT page_limit
    OFFSET page_offset;
END;
$$ LANGUAGE plpgsql;

-- Create function to get total count for pagination
CREATE OR REPLACE FUNCTION get_earnings_news_count_for_user(
    user_country TEXT DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
    total_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO total_count
    FROM earnings_news en
    WHERE en.status = true
    AND (
        en.countries IS NULL 
        OR user_country IS NULL 
        OR user_country = ANY(en.countries)
    );
    
    RETURN total_count;
END;
$$ LANGUAGE plpgsql;

-- Create function for admin to get all earnings news with pagination
CREATE OR REPLACE FUNCTION get_all_earnings_news_admin(
    page_offset INTEGER DEFAULT 0,
    page_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
    id UUID,
    title TEXT,
    thumbnail TEXT,
    description TEXT,
    money DECIMAL,
    countries TEXT[],
    status BOOLEAN,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        en.id,
        en.title,
        en.thumbnail,
        en.description,
        en.money,
        en.countries,
        en.status,
        en.created_at,
        en.updated_at
    FROM earnings_news en
    ORDER BY en.created_at DESC
    LIMIT page_limit
    OFFSET page_offset;
END;
$$ LANGUAGE plpgsql;

-- Create function to get total count for admin pagination
CREATE OR REPLACE FUNCTION get_all_earnings_news_count_admin()
RETURNS INTEGER AS $$
DECLARE
    total_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_count FROM earnings_news;
    RETURN total_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE earnings_news IS 'Stores earning-related news posts that can be targeted to specific countries';
COMMENT ON FUNCTION get_earnings_news_for_user IS 'Gets earnings news filtered by user country with pagination';
COMMENT ON FUNCTION get_earnings_news_count_for_user IS 'Gets total count of earnings news for user country filtering';
COMMENT ON FUNCTION get_all_earnings_news_admin IS 'Gets all earnings news for admin panel with pagination';
COMMENT ON FUNCTION get_all_earnings_news_count_admin IS 'Gets total count of all earnings news for admin pagination';
