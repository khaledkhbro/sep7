-- Create 3-level marketplace category structure
-- Level 1: Categories
-- Level 2: Subcategories  
-- Level 3: Micro Categories

CREATE TABLE IF NOT EXISTS marketplace_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  logo TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS marketplace_subcategories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES marketplace_categories(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  description TEXT,
  logo TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(category_id, slug)
);

CREATE TABLE IF NOT EXISTS marketplace_micro_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subcategory_id UUID NOT NULL REFERENCES marketplace_subcategories(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  description TEXT,
  logo TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(subcategory_id, slug)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_marketplace_subcategories_category_id ON marketplace_subcategories(category_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_micro_categories_subcategory_id ON marketplace_micro_categories(subcategory_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_categories_sort_order ON marketplace_categories(sort_order);
CREATE INDEX IF NOT EXISTS idx_marketplace_subcategories_sort_order ON marketplace_subcategories(sort_order);
CREATE INDEX IF NOT EXISTS idx_marketplace_micro_categories_sort_order ON marketplace_micro_categories(sort_order);
