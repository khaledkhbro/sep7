-- Seed categories for microjobs and marketplace
INSERT INTO categories (name, slug, description, icon) VALUES
('Web Development', 'web-development', 'Website and web application development', 'code'),
('Mobile Development', 'mobile-development', 'iOS and Android app development', 'smartphone'),
('Design & Creative', 'design-creative', 'Graphic design, UI/UX, and creative services', 'palette'),
('Writing & Translation', 'writing-translation', 'Content writing, copywriting, and translation', 'edit'),
('Digital Marketing', 'digital-marketing', 'SEO, social media, and online marketing', 'trending-up'),
('Data & Analytics', 'data-analytics', 'Data analysis, research, and business intelligence', 'bar-chart'),
('Video & Animation', 'video-animation', 'Video editing, animation, and multimedia', 'video'),
('Music & Audio', 'music-audio', 'Audio editing, music production, and voice over', 'music'),
('Business Services', 'business-services', 'Virtual assistance, consulting, and business support', 'briefcase'),
('Education & Training', 'education-training', 'Online tutoring, course creation, and training', 'book-open');

-- Subcategories for Web Development
INSERT INTO categories (name, slug, description, parent_id) VALUES
('Frontend Development', 'frontend-development', 'React, Vue, Angular development', (SELECT id FROM categories WHERE slug = 'web-development')),
('Backend Development', 'backend-development', 'Node.js, Python, PHP development', (SELECT id FROM categories WHERE slug = 'web-development')),
('Full Stack Development', 'fullstack-development', 'Complete web application development', (SELECT id FROM categories WHERE slug = 'web-development')),
('WordPress Development', 'wordpress-development', 'WordPress themes and plugins', (SELECT id FROM categories WHERE slug = 'web-development'));
