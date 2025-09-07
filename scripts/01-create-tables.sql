-- Users table for authentication and profiles
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    phone VARCHAR(20),
    avatar_url TEXT,
    bio TEXT,
    location VARCHAR(255),
    skills TEXT[], -- Array of skills
    rating DECIMAL(3,2) DEFAULT 0.00,
    total_reviews INTEGER DEFAULT 0,
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    user_type VARCHAR(20) DEFAULT 'user', -- 'user', 'admin'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Categories for jobs and marketplace items
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    parent_id UUID REFERENCES categories(id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Microjobs table
CREATE TABLE microjobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES categories(id),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    requirements TEXT,
    budget_min DECIMAL(10,2),
    budget_max DECIMAL(10,2),
    deadline DATE,
    location VARCHAR(255),
    is_remote BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'open', -- 'open', 'in_progress', 'completed', 'cancelled'
    priority VARCHAR(10) DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
    attachments TEXT[], -- Array of file URLs
    skills_required TEXT[],
    applications_count INTEGER DEFAULT 0,
    views_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Job applications
CREATE TABLE job_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES microjobs(id) ON DELETE CASCADE,
    applicant_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    cover_letter TEXT,
    proposed_budget DECIMAL(10,2),
    estimated_duration VARCHAR(50),
    portfolio_links TEXT[],
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'accepted', 'rejected'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(job_id, applicant_id)
);

-- Marketplace items (Fiverr-like services)
CREATE TABLE marketplace_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES categories(id),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    short_description VARCHAR(500),
    price DECIMAL(10,2) NOT NULL,
    delivery_time INTEGER NOT NULL, -- in days
    revisions_included INTEGER DEFAULT 0,
    images TEXT[], -- Array of image URLs
    tags TEXT[],
    requirements TEXT, -- What buyer needs to provide
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'paused', 'draft'
    rating DECIMAL(3,2) DEFAULT 0.00,
    total_orders INTEGER DEFAULT 0,
    views_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Orders for marketplace items
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    marketplace_item_id UUID NOT NULL REFERENCES marketplace_items(id),
    buyer_id UUID NOT NULL REFERENCES users(id),
    seller_id UUID NOT NULL REFERENCES users(id),
    amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'in_progress', 'delivered', 'completed', 'cancelled', 'disputed'
    requirements_provided TEXT,
    delivery_date DATE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Wallet system
CREATE TABLE wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    balance DECIMAL(12,2) DEFAULT 0.00,
    pending_balance DECIMAL(12,2) DEFAULT 0.00, -- Money on hold
    total_earned DECIMAL(12,2) DEFAULT 0.00,
    total_spent DECIMAL(12,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Wallet transactions
CREATE TABLE wallet_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID NOT NULL REFERENCES wallets(id),
    type VARCHAR(20) NOT NULL, -- 'deposit', 'withdrawal', 'payment', 'earning', 'refund'
    amount DECIMAL(12,2) NOT NULL,
    description TEXT,
    reference_id UUID, -- Can reference orders, jobs, etc.
    reference_type VARCHAR(50), -- 'order', 'job', 'withdrawal', etc.
    status VARCHAR(20) DEFAULT 'completed', -- 'pending', 'completed', 'failed'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reviews and ratings
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reviewer_id UUID NOT NULL REFERENCES users(id),
    reviewee_id UUID NOT NULL REFERENCES users(id),
    order_id UUID REFERENCES orders(id),
    job_id UUID REFERENCES microjobs(id),
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(reviewer_id, order_id),
    UNIQUE(reviewer_id, job_id)
);

-- Notifications
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'job_application', 'order_update', 'payment', 'review', etc.
    reference_id UUID,
    reference_type VARCHAR(50),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Referral system
CREATE TABLE referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id UUID NOT NULL REFERENCES users(id),
    referred_id UUID NOT NULL REFERENCES users(id),
    referral_code VARCHAR(20) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'completed'
    reward_amount DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(referrer_id, referred_id)
);

-- User referral codes
CREATE TABLE referral_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    code VARCHAR(20) UNIQUE NOT NULL,
    uses_count INTEGER DEFAULT 0,
    max_uses INTEGER DEFAULT 100,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);
