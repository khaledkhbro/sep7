-- Adding comprehensive 3-level category structure based on Fiverr
-- Clear existing data and populate with Fiverr-style categories

-- Clear existing data
DELETE FROM marketplace_micro_categories;
DELETE FROM marketplace_subcategories;
DELETE FROM marketplace_categories;

-- Graphics & Design Category
INSERT INTO marketplace_categories (id, name, description, icon, sort_order) VALUES
(1, 'Graphics & Design', 'Visual design and creative services', '🎨', 1);

INSERT INTO marketplace_subcategories (id, category_id, name, description, sort_order) VALUES
(1, 1, 'Logo & Brand Identity', 'Logo design and brand identity services', 1),
(2, 1, 'Art & Illustration', 'Custom artwork and illustrations', 2),
(3, 1, 'Web & App Design', 'UI/UX and digital design', 3),
(4, 1, 'Print Design', 'Print materials and layouts', 4),
(5, 1, 'Marketing Design', 'Marketing and advertising materials', 5),
(6, 1, 'Packaging & Covers', 'Product packaging and book covers', 6);

-- Logo & Brand Identity Micro Categories
INSERT INTO marketplace_micro_categories (subcategory_id, name, description, sort_order) VALUES
(1, 'Logo Design', 'Custom logo creation', 1),
(1, 'Brand Style Guides', 'Complete brand identity packages', 2),
(1, 'Business Cards & Stationery', 'Professional business materials', 3),
(1, 'Fonts & Typography', 'Custom fonts and typography', 4),
(1, 'Brand Consulting', 'Brand strategy and consulting', 5);

-- Art & Illustration Micro Categories
INSERT INTO marketplace_micro_categories (subcategory_id, name, description, sort_order) VALUES
(2, 'Illustration', 'Custom illustrations and artwork', 1),
(2, 'AI Artists', 'AI-generated artwork', 2),
(2, 'Children Book Illustration', 'Illustrations for children books', 3),
(2, 'Portraits & Caricatures', 'Custom portraits and caricatures', 4),
(2, 'Cartoons & Comics', 'Cartoon and comic artwork', 5),
(2, 'Pattern Design', 'Custom patterns and textures', 6),
(2, 'Tattoo Design', 'Custom tattoo designs', 7);

-- Web & App Design Micro Categories
INSERT INTO marketplace_micro_categories (subcategory_id, name, description, sort_order) VALUES
(3, 'Website Design', 'Complete website design', 1),
(3, 'App Design', 'Mobile and web app design', 2),
(3, 'UX Design', 'User experience design', 3),
(3, 'Landing Page Design', 'High-converting landing pages', 4),
(3, 'Icon Design', 'Custom icon sets', 5),
(3, 'Email Design', 'Email template design', 6);

-- Print Design Micro Categories
INSERT INTO marketplace_micro_categories (subcategory_id, name, description, sort_order) VALUES
(4, 'Flyer Design', 'Promotional flyers and leaflets', 1),
(4, 'Brochure Design', 'Professional brochures', 2),
(4, 'Poster Design', 'Event and promotional posters', 3),
(4, 'Catalog Design', 'Product catalogs', 4),
(4, 'Menu Design', 'Restaurant and cafe menus', 5),
(4, 'Resume Design', 'Professional resume layouts', 6);

-- Marketing Design Micro Categories
INSERT INTO marketplace_micro_categories (subcategory_id, name, description, sort_order) VALUES
(5, 'Social Media Design', 'Social media graphics and templates', 1),
(5, 'Banner Ads', 'Web and display advertising', 2),
(5, 'Signage Design', 'Business signage and displays', 3),
(5, 'Trade Booth Design', 'Exhibition and trade show materials', 4),
(5, 'Infographic Design', 'Data visualization and infographics', 5);

-- Packaging & Covers Micro Categories
INSERT INTO marketplace_micro_categories (subcategory_id, name, description, sort_order) VALUES
(6, 'Packaging & Label Design', 'Product packaging design', 1),
(6, 'Book Design', 'Book covers and layouts', 2),
(6, 'Album Cover Design', 'Music album artwork', 3),
(6, 'Podcast Cover Art', 'Podcast branding and covers', 4);

-- Programming & Tech Category
INSERT INTO marketplace_categories (id, name, description, icon, sort_order) VALUES
(2, 'Programming & Tech', 'Software development and technical services', '💻', 2);

INSERT INTO marketplace_subcategories (id, category_id, name, description, sort_order) VALUES
(7, 2, 'Website Development', 'Full-stack web development', 1),
(8, 2, 'Mobile App Development', 'iOS and Android development', 2),
(9, 2, 'Desktop Applications', 'Desktop software development', 3),
(10, 2, 'Chatbot Development', 'AI chatbots and automation', 4),
(11, 2, 'Game Development', 'Video game creation', 5),
(12, 2, 'Cybersecurity & Data Protection', 'Security and data services', 6),
(13, 2, 'Data Science & ML', 'Analytics and machine learning', 7),
(14, 2, 'Software Testing', 'QA and testing services', 8);

-- Website Development Micro Categories
INSERT INTO marketplace_micro_categories (subcategory_id, name, description, sort_order) VALUES
(7, 'WordPress', 'WordPress development and customization', 1),
(7, 'Shopify', 'E-commerce store development', 2),
(7, 'Custom Websites', 'Full-stack custom development', 3),
(7, 'Bug Fixes', 'Website debugging and fixes', 4),
(7, 'Backup & Migration', 'Website backup and migration', 5),
(7, 'Speed Optimization', 'Website performance optimization', 6);

-- Mobile App Development Micro Categories
INSERT INTO marketplace_micro_categories (subcategory_id, name, description, sort_order) VALUES
(8, 'Cross-platform Development', 'React Native, Flutter apps', 1),
(8, 'Android App Development', 'Native Android development', 2),
(8, 'iOS App Development', 'Native iOS development', 3),
(8, 'Mobile App UI Design', 'Mobile interface design', 4),
(8, 'App Store Optimization', 'ASO and app marketing', 5);

-- Digital Marketing Category
INSERT INTO marketplace_categories (id, name, description, icon, sort_order) VALUES
(3, 'Digital Marketing', 'Online marketing and promotion services', '📈', 3);

INSERT INTO marketplace_subcategories (id, category_id, name, description, sort_order) VALUES
(15, 3, 'Search Engine Optimization', 'SEO and search marketing', 1),
(16, 3, 'Social Media Marketing', 'Social platform marketing', 2),
(17, 3, 'Content Marketing', 'Content creation and strategy', 3),
(18, 3, 'Video Marketing', 'Video content and promotion', 4),
(19, 3, 'Email Marketing', 'Email campaigns and automation', 5),
(20, 3, 'Influencer Marketing', 'Influencer partnerships', 6),
(21, 3, 'Marketing Strategy', 'Strategic marketing planning', 7);

-- SEO Micro Categories
INSERT INTO marketplace_micro_categories (subcategory_id, name, description, sort_order) VALUES
(15, 'Search Engine Optimization', 'Complete SEO services', 1),
(15, 'Local SEO', 'Local business optimization', 2),
(15, 'E-commerce SEO', 'Online store optimization', 3),
(15, 'Technical SEO', 'Technical website optimization', 4),
(15, 'SEO Audits & Reports', 'SEO analysis and reporting', 5);

-- Social Media Marketing Micro Categories
INSERT INTO marketplace_micro_categories (subcategory_id, name, description, sort_order) VALUES
(16, 'Social Media Management', 'Complete social media management', 1),
(16, 'Paid Social Media', 'Social media advertising', 2),
(16, 'Influencer Marketing', 'Influencer campaign management', 3),
(16, 'Community Management', 'Online community building', 4);

-- Writing & Translation Category
INSERT INTO marketplace_categories (id, name, description, icon, sort_order) VALUES
(4, 'Writing & Translation', 'Content creation and language services', '✍️', 4);

INSERT INTO marketplace_subcategories (id, category_id, name, description, sort_order) VALUES
(22, 4, 'Content Writing', 'Articles, blogs, and web content', 1),
(23, 4, 'Copywriting', 'Marketing and sales copy', 2),
(24, 4, 'Technical Writing', 'Documentation and manuals', 3),
(25, 4, 'Creative Writing', 'Stories, scripts, and creative content', 4),
(26, 4, 'Translation & Localization', 'Language translation services', 5),
(27, 4, 'Proofreading & Editing', 'Content review and editing', 6);

-- Content Writing Micro Categories
INSERT INTO marketplace_micro_categories (subcategory_id, name, description, sort_order) VALUES
(22, 'Articles & Blog Posts', 'Blog writing and articles', 1),
(22, 'Website Content', 'Web page content creation', 2),
(22, 'Product Descriptions', 'E-commerce product content', 3),
(22, 'Press Releases', 'PR and news content', 4),
(22, 'UX Writing', 'User interface copy', 5);

-- Video & Animation Category
INSERT INTO marketplace_categories (id, name, description, icon, sort_order) VALUES
(5, 'Video & Animation', 'Video production and motion graphics', '🎬', 5);

INSERT INTO marketplace_subcategories (id, category_id, name, description, sort_order) VALUES
(28, 5, 'Video Editing', 'Professional video editing', 1),
(29, 5, 'Animation', '2D and 3D animation services', 2),
(30, 5, 'Video Production', 'Complete video production', 3),
(31, 5, 'Motion Graphics', 'Animated graphics and effects', 4);

-- Video Editing Micro Categories
INSERT INTO marketplace_micro_categories (subcategory_id, name, description, sort_order) VALUES
(28, 'Video Editing', 'Professional video editing', 1),
(28, 'Visual Effects', 'VFX and special effects', 2),
(28, 'Video Ads & Commercials', 'Advertising video content', 3),
(28, 'Slideshow Videos', 'Photo slideshow creation', 4);

-- Music & Audio Category
INSERT INTO marketplace_categories (id, name, description, icon, sort_order) VALUES
(6, 'Music & Audio', 'Audio production and music services', '🎵', 6);

INSERT INTO marketplace_subcategories (id, category_id, name, description, sort_order) VALUES
(32, 6, 'Music Production', 'Music creation and production', 1),
(33, 6, 'Audio Editing', 'Audio post-production', 2),
(34, 6, 'Voice Over', 'Voice acting and narration', 3),
(35, 6, 'Sound Design', 'Audio effects and soundscapes', 4);

-- Voice Over Micro Categories
INSERT INTO marketplace_micro_categories (subcategory_id, name, description, sort_order) VALUES
(33, 'Voice Over', 'Professional voice acting', 1),
(33, 'Podcast Production', 'Podcast editing and production', 2),
(33, 'Audiobook Narration', 'Book narration services', 3),
(33, 'Commercial Voice Over', 'Advertising voice work', 4);

-- Business Category
INSERT INTO marketplace_categories (id, name, description, icon, sort_order) VALUES
(7, 'Business', 'Business consulting and services', '💼', 7);

INSERT INTO marketplace_subcategories (id, category_id, name, description, sort_order) VALUES
(36, 7, 'Business Plans', 'Business planning and strategy', 1),
(37, 7, 'Legal Consulting', 'Legal advice and documentation', 2),
(38, 7, 'Financial Consulting', 'Financial planning and analysis', 3),
(39, 7, 'HR Consulting', 'Human resources services', 4),
(40, 7, 'Market Research', 'Market analysis and research', 5);

-- Business Plans Micro Categories
INSERT INTO marketplace_micro_categories (subcategory_id, name, description, sort_order) VALUES
(36, 'Business Plans', 'Complete business plan creation', 1),
(36, 'Financial Modeling', 'Financial projections and models', 2),
(36, 'Pitch Decks', 'Investor presentation decks', 3),
(36, 'Market Research', 'Industry and market analysis', 4);

-- AI Services Category
INSERT INTO marketplace_categories (id, name, description, icon, sort_order) VALUES
(8, 'AI Services', 'Artificial intelligence and automation', '🤖', 8);

INSERT INTO marketplace_subcategories (id, category_id, name, description, sort_order) VALUES
(41, 8, 'AI Development', 'Custom AI solutions', 1),
(42, 8, 'Machine Learning', 'ML models and algorithms', 2),
(43, 8, 'AI Content Creation', 'AI-powered content generation', 3),
(44, 8, 'Chatbots & Virtual Assistants', 'Conversational AI', 4);

-- AI Development Micro Categories
INSERT INTO marketplace_micro_categories (subcategory_id, name, description, sort_order) VALUES
(41, 'Custom AI Solutions', 'Tailored AI development', 1),
(41, 'AI Integration', 'AI system integration', 2),
(42, 'Machine Learning Models', 'Custom ML development', 3),
(42, 'Data Analysis', 'AI-powered data insights', 4),
(43, 'AI Writing', 'AI content generation', 5),
(43, 'AI Art Generation', 'AI-powered artwork', 6);

-- Lifestyle Category
INSERT INTO marketplace_categories (id, name, description, icon, sort_order) VALUES
(9, 'Lifestyle', 'Personal and lifestyle services', '🌟', 9);

INSERT INTO marketplace_subcategories (id, category_id, name, description, sort_order) VALUES
(45, 9, 'Gaming', 'Gaming and esports services', 1),
(46, 9, 'Fitness & Wellness', 'Health and fitness coaching', 2),
(47, 9, 'Nutrition & Diet', 'Nutrition planning and advice', 3),
(48, 9, 'Relationship & Family', 'Personal relationship advice', 4);

-- Gaming Micro Categories
INSERT INTO marketplace_micro_categories (subcategory_id, name, description, sort_order) VALUES
(45, 'Gaming Lessons', 'Video game coaching', 1),
(45, 'Game Reviews', 'Professional game reviews', 2),
(45, 'Esports Coaching', 'Competitive gaming training', 3),
(45, 'Game Testing', 'Beta testing and QA', 4);

-- Photography Category
INSERT INTO marketplace_categories (id, name, description, icon, sort_order) VALUES
(10, 'Photography', 'Photography and image services', '📸', 10);

INSERT INTO marketplace_subcategories (id, category_id, name, description, sort_order) VALUES
(49, 10, 'Photo Editing', 'Professional photo editing', 1),
(50, 10, 'Photography Services', 'Professional photography', 2),
(51, 10, 'Product Photography', 'E-commerce product photos', 3);

-- Photo Editing Micro Categories
INSERT INTO marketplace_micro_categories (subcategory_id, name, description, sort_order) VALUES
(49, 'Photo Retouching', 'Professional photo enhancement', 1),
(49, 'Background Removal', 'Image background editing', 2),
(49, 'Photo Restoration', 'Old photo restoration', 3),
(49, 'Color Correction', 'Photo color enhancement', 4),
(50, 'Portrait Photography', 'Professional portraits', 5),
(50, 'Event Photography', 'Event and wedding photos', 6),
(51, 'Product Photography', 'E-commerce product shots', 7),
(51, 'Lifestyle Photography', 'Lifestyle and brand photos', 8);
