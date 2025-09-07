-- Adding category management tables with minimum payments and subcategories
-- Update categories table to support minimum payments
ALTER TABLE categories ADD COLUMN IF NOT EXISTS minimum_payment DECIMAL(10,2) DEFAULT 0.00;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- Create subcategories table for better organization
CREATE TABLE IF NOT EXISTS subcategories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    description TEXT,
    minimum_payment DECIMAL(10,2) DEFAULT 0.00,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(category_id, slug)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_subcategories_category_id ON subcategories(category_id);
CREATE INDEX IF NOT EXISTS idx_subcategories_active ON subcategories(is_active);

-- Update microjobs table to support subcategories
ALTER TABLE microjobs ADD COLUMN IF NOT EXISTS subcategory_id UUID REFERENCES subcategories(id);
CREATE INDEX IF NOT EXISTS idx_microjobs_subcategory_id ON microjobs(subcategory_id);
