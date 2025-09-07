-- Seeding categories and subcategories for microjob platform
-- Clear existing categories and add microjob-specific ones
DELETE FROM categories WHERE slug IN ('web-development', 'mobile-development', 'design-creative', 'writing-translation', 'digital-marketing', 'data-analytics', 'video-animation', 'music-audio', 'business-services', 'education-training');

-- Insert main categories for microjobs
INSERT INTO categories (name, slug, description, icon, minimum_payment, sort_order) VALUES
('Social Media', 'social-media', 'Social media engagement and promotion tasks', 'share-2', 0.50, 1),
('Content Creation', 'content-creation', 'Writing, video, and creative content tasks', 'edit-3', 1.00, 2),
('Data Entry', 'data-entry', 'Data collection and entry tasks', 'database', 0.25, 3),
('Testing & Reviews', 'testing-reviews', 'App testing, website reviews, and feedback', 'star', 0.75, 4),
('Research', 'research', 'Online research and information gathering', 'search', 1.50, 5),
('Marketing', 'marketing', 'Digital marketing and promotional tasks', 'trending-up', 2.00, 6),
('Other', 'other', 'Miscellaneous microtasks', 'more-horizontal', 0.10, 7);

-- Insert subcategories for Social Media
INSERT INTO subcategories (category_id, name, slug, description, minimum_payment, sort_order) VALUES
((SELECT id FROM categories WHERE slug = 'social-media'), 'Facebook Tasks', 'facebook', 'Facebook likes, shares, follows, and engagement', 0.50, 1),
((SELECT id FROM categories WHERE slug = 'social-media'), 'YouTube Tasks', 'youtube', 'YouTube views, likes, subscribes, and comments', 0.75, 2),
((SELECT id FROM categories WHERE slug = 'social-media'), 'TikTok Tasks', 'tiktok', 'TikTok likes, follows, views, and engagement', 0.60, 3),
((SELECT id FROM categories WHERE slug = 'social-media'), 'Instagram Tasks', 'instagram', 'Instagram likes, follows, and story views', 0.65, 4),
((SELECT id FROM categories WHERE slug = 'social-media'), 'Twitter Tasks', 'twitter', 'Twitter likes, retweets, and follows', 0.55, 5),
((SELECT id FROM categories WHERE slug = 'social-media'), 'Telegram Tasks', 'telegram', 'Telegram channel joins and engagement', 0.40, 6);

-- Insert subcategories for Content Creation
INSERT INTO subcategories (category_id, name, slug, description, minimum_payment, sort_order) VALUES
((SELECT id FROM categories WHERE slug = 'content-creation'), 'Article Writing', 'article-writing', 'Short articles and blog posts', 5.00, 1),
((SELECT id FROM categories WHERE slug = 'content-creation'), 'Product Reviews', 'product-reviews', 'Product and service reviews', 2.50, 2),
((SELECT id FROM categories WHERE slug = 'content-creation'), 'Video Creation', 'video-creation', 'Short video content creation', 10.00, 3),
((SELECT id FROM categories WHERE slug = 'content-creation'), 'Image Editing', 'image-editing', 'Basic photo editing and enhancement', 3.00, 4);

-- Insert subcategories for Data Entry
INSERT INTO subcategories (category_id, name, slug, description, minimum_payment, sort_order) VALUES
((SELECT id FROM categories WHERE slug = 'data-entry'), 'Form Filling', 'form-filling', 'Online form completion and submission', 0.25, 1),
((SELECT id FROM categories WHERE slug = 'data-entry'), 'Data Collection', 'data-collection', 'Gathering information from websites', 0.50, 2),
((SELECT id FROM categories WHERE slug = 'data-entry'), 'Spreadsheet Work', 'spreadsheet-work', 'Excel and Google Sheets data entry', 0.75, 3),
((SELECT id FROM categories WHERE slug = 'data-entry'), 'Contact Research', 'contact-research', 'Finding contact information and emails', 1.00, 4);

-- Insert subcategories for Testing & Reviews
INSERT INTO subcategories (category_id, name, slug, description, minimum_payment, sort_order) VALUES
((SELECT id FROM categories WHERE slug = 'testing-reviews'), 'App Testing', 'app-testing', 'Mobile and web application testing', 2.00, 1),
((SELECT id FROM categories WHERE slug = 'testing-reviews'), 'Website Reviews', 'website-reviews', 'Website usability and feedback', 1.50, 2),
((SELECT id FROM categories WHERE slug = 'testing-reviews'), 'Product Testing', 'product-testing', 'Physical and digital product testing', 3.00, 3),
((SELECT id FROM categories WHERE slug = 'testing-reviews'), 'Survey Participation', 'survey-participation', 'Online surveys and questionnaires', 0.75, 4);

-- Insert subcategories for Research
INSERT INTO subcategories (category_id, name, slug, description, minimum_payment, sort_order) VALUES
((SELECT id FROM categories WHERE slug = 'research'), 'Market Research', 'market-research', 'Industry and market analysis', 5.00, 1),
((SELECT id FROM categories WHERE slug = 'research'), 'Lead Generation', 'lead-generation', 'Finding potential customers and contacts', 2.00, 2),
((SELECT id FROM categories WHERE slug = 'research'), 'Competitor Analysis', 'competitor-analysis', 'Analyzing competitor strategies', 3.00, 3),
((SELECT id FROM categories WHERE slug = 'research'), 'Price Comparison', 'price-comparison', 'Comparing prices across platforms', 1.50, 4);

-- Insert subcategories for Marketing
INSERT INTO subcategories (category_id, name, slug, description, minimum_payment, sort_order) VALUES
((SELECT id FROM categories WHERE slug = 'marketing'), 'Email Marketing', 'email-marketing', 'Email campaign creation and management', 5.00, 1),
((SELECT id FROM categories WHERE slug = 'marketing'), 'SEO Tasks', 'seo-tasks', 'Search engine optimization activities', 3.00, 2),
((SELECT id FROM categories WHERE slug = 'marketing'), 'Social Media Marketing', 'social-media-marketing', 'Social media campaign management', 4.00, 3),
((SELECT id FROM categories WHERE slug = 'marketing'), 'Content Marketing', 'content-marketing', 'Content strategy and promotion', 6.00, 4);
