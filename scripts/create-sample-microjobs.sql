-- Create sample microjobs for testing the algorithm
-- First, ensure we have some categories
INSERT INTO categories (id, name, slug, description, is_active) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Web Development', 'web-development', 'Website and web application development', true),
('550e8400-e29b-41d4-a716-446655440002', 'Graphic Design', 'graphic-design', 'Logo, branding, and visual design services', true),
('550e8400-e29b-41d4-a716-446655440003', 'Content Writing', 'content-writing', 'Blog posts, articles, and copywriting', true),
('550e8400-e29b-41d4-a716-446655440004', 'Digital Marketing', 'digital-marketing', 'SEO, social media, and online marketing', true),
('550e8400-e29b-41d4-a716-446655440005', 'Data Entry', 'data-entry', 'Data processing and administrative tasks', true)
ON CONFLICT (id) DO NOTHING;

-- Create sample users if they don't exist
INSERT INTO users (id, email, password_hash, first_name, last_name, username, user_type, is_verified) VALUES
('550e8400-e29b-41d4-a716-446655440010', 'john@example.com', '$2b$10$dummy', 'John', 'Doe', 'johndoe', 'user', true),
('550e8400-e29b-41d4-a716-446655440011', 'jane@example.com', '$2b$10$dummy', 'Jane', 'Smith', 'janesmith', 'user', true),
('550e8400-e29b-41d4-a716-446655440012', 'mike@example.com', '$2b$10$dummy', 'Mike', 'Johnson', 'mikejohnson', 'user', true),
('550e8400-e29b-41d4-a716-446655440013', 'sarah@example.com', '$2b$10$dummy', 'Sarah', 'Wilson', 'sarahwilson', 'user', true),
('550e8400-e29b-41d4-a716-446655440014', 'alex@example.com', '$2b$10$dummy', 'Alex', 'Brown', 'alexbrown', 'user', true)
ON CONFLICT (id) DO NOTHING;

-- Create sample microjobs
INSERT INTO microjobs (id, user_id, category_id, title, description, budget_min, budget_max, status, created_at, updated_at) VALUES
('550e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440001', 'Build a Simple Landing Page', 'Need a responsive landing page for my startup. Should include hero section, features, and contact form.', 100.00, 300.00, 'open', NOW() - INTERVAL '1 hour', NOW()),
('550e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440002', 'Design Logo for Coffee Shop', 'Looking for a modern, minimalist logo for my new coffee shop. Should work well on signage and packaging.', 50.00, 150.00, 'open', NOW() - INTERVAL '2 hours', NOW()),
('550e8400-e29b-41d4-a716-446655440022', '550e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440003', 'Write 10 Blog Posts', 'Need 10 SEO-optimized blog posts for my fitness website. Each post should be 800-1000 words.', 200.00, 400.00, 'open', NOW() - INTERVAL '3 hours', NOW()),
('550e8400-e29b-41d4-a716-446655440023', '550e8400-e29b-41d4-a716-446655440013', '550e8400-e29b-41d4-a716-446655440004', 'Social Media Marketing Campaign', 'Create and manage a 30-day social media campaign for my online store. Include content creation and posting.', 300.00, 600.00, 'open', NOW() - INTERVAL '4 hours', NOW()),
('550e8400-e29b-41d4-a716-446655440024', '550e8400-e29b-41d4-a716-446655440014', '550e8400-e29b-41d4-a716-446655440005', 'Data Entry for Product Catalog', 'Need someone to enter 500 product details into my e-commerce database. Includes images, descriptions, and pricing.', 75.00, 125.00, 'open', NOW() - INTERVAL '5 hours', NOW()),
('550e8400-e29b-41d4-a716-446655440025', '550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440001', 'Fix WordPress Website Issues', 'My WordPress site has some bugs and performance issues. Need an experienced developer to fix them.', 150.00, 250.00, 'open', NOW() - INTERVAL '6 hours', NOW()),
('550e8400-e29b-41d4-a716-446655440026', '550e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440002', 'Create Business Card Design', 'Need professional business card design for my consulting firm. Should be elegant and corporate.', 25.00, 75.00, 'open', NOW() - INTERVAL '7 hours', NOW()),
('550e8400-e29b-41d4-a716-446655440027', '550e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440003', 'Product Descriptions for E-commerce', 'Write compelling product descriptions for 50 items in my online store. Focus on benefits and SEO.', 100.00, 200.00, 'open', NOW() - INTERVAL '8 hours', NOW()),
('550e8400-e29b-41d4-a716-446655440028', '550e8400-e29b-41d4-a716-446655440013', '550e8400-e29b-41d4-a716-446655440004', 'Google Ads Campaign Setup', 'Set up and optimize Google Ads campaign for my local service business. Include keyword research.', 200.00, 400.00, 'open', NOW() - INTERVAL '9 hours', NOW()),
('550e8400-e29b-41d4-a716-446655440029', '550e8400-e29b-41d4-a716-446655440014', '550e8400-e29b-41d4-a716-446655440001', 'Mobile App UI Design', 'Design modern UI screens for a fitness tracking mobile app. Need 8-10 screens with consistent design.', 400.00, 800.00, 'open', NOW() - INTERVAL '10 hours', NOW())
ON CONFLICT (id) DO NOTHING;

-- Initialize rotation tracking for the sample jobs
INSERT INTO microjob_rotation_tracking (job_id, last_front_page_at, rotation_cycle, front_page_duration_minutes)
SELECT 
    id::integer,
    created_at,
    1,
    EXTRACT(EPOCH FROM (NOW() - created_at)) / 60
FROM microjobs 
WHERE status = 'open'
ON CONFLICT (job_id) DO NOTHING;
