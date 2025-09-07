-- Seed fake microjobs for testing and demonstration
-- This script creates realistic microjob postings across various categories

INSERT INTO microjobs (
    user_id, 
    category_id, 
    title, 
    description, 
    requirements, 
    budget_min, 
    budget_max, 
    deadline, 
    location, 
    is_remote, 
    status, 
    priority, 
    skills_required,
    views_count,
    applications_count
) VALUES 
-- Web Development Jobs
(
    (SELECT id FROM users ORDER BY RANDOM() LIMIT 1),
    (SELECT id FROM categories WHERE slug = 'web-development' LIMIT 1),
    'Build a Modern E-commerce Website',
    'I need a professional e-commerce website built from scratch using React and Node.js. The site should include product catalog, shopping cart, payment integration, and admin dashboard. Must be mobile-responsive and SEO optimized.',
    'Experience with React, Node.js, MongoDB, Stripe integration, and responsive design. Portfolio of previous e-commerce projects required.',
    2500.00,
    4000.00,
    CURRENT_DATE + INTERVAL '30 days',
    'New York, NY',
    true,
    'open',
    'high',
    ARRAY['React', 'Node.js', 'MongoDB', 'Stripe', 'CSS', 'JavaScript'],
    45,
    8
),
(
    (SELECT id FROM users ORDER BY RANDOM() LIMIT 1),
    (SELECT id FROM categories WHERE slug = 'web-development' LIMIT 1),
    'Fix WordPress Plugin Compatibility Issues',
    'My WordPress site has conflicts between plugins causing checkout errors. Need an experienced developer to debug and fix these issues quickly.',
    'Strong WordPress development skills, plugin debugging experience, and knowledge of WooCommerce.',
    300.00,
    600.00,
    CURRENT_DATE + INTERVAL '7 days',
    'Remote',
    true,
    'open',
    'urgent',
    ARRAY['WordPress', 'PHP', 'WooCommerce', 'Debugging'],
    23,
    12
),

-- Graphic Design Jobs
(
    (SELECT id FROM users ORDER BY RANDOM() LIMIT 1),
    (SELECT id FROM categories WHERE slug = 'graphic-design' LIMIT 1),
    'Design Modern Logo and Brand Identity',
    'Looking for a creative designer to create a complete brand identity package including logo, color palette, typography, and brand guidelines for my tech startup.',
    'Proven experience in brand design, strong portfolio, proficiency in Adobe Creative Suite, and understanding of modern design trends.',
    800.00,
    1500.00,
    CURRENT_DATE + INTERVAL '14 days',
    'San Francisco, CA',
    true,
    'open',
    'normal',
    ARRAY['Adobe Illustrator', 'Adobe Photoshop', 'Brand Design', 'Logo Design'],
    67,
    15
),
(
    (SELECT id FROM users ORDER BY RANDOM() LIMIT 1),
    (SELECT id FROM categories WHERE slug = 'graphic-design' LIMIT 1),
    'Create Social Media Graphics Package',
    'Need 20 Instagram post templates and 10 story templates for my fitness brand. Should be consistent with brand colors and include editable text areas.',
    'Experience with social media design, Instagram format knowledge, and template creation skills.',
    200.00,
    400.00,
    CURRENT_DATE + INTERVAL '10 days',
    'Remote',
    true,
    'open',
    'normal',
    ARRAY['Adobe Photoshop', 'Canva', 'Social Media Design', 'Template Design'],
    34,
    9
),

-- Writing & Content Jobs
(
    (SELECT id FROM users ORDER BY RANDOM() LIMIT 1),
    (SELECT id FROM categories WHERE slug = 'writing-translation' LIMIT 1),
    'Write SEO Blog Articles for Tech Company',
    'Need 10 high-quality, SEO-optimized blog articles (1500+ words each) about artificial intelligence, machine learning, and tech trends. Must be original and well-researched.',
    'Excellent English writing skills, SEO knowledge, tech industry experience, and ability to research complex topics.',
    1000.00,
    2000.00,
    CURRENT_DATE + INTERVAL '21 days',
    'Remote',
    true,
    'open',
    'normal',
    ARRAY['SEO Writing', 'Content Marketing', 'Tech Writing', 'Research'],
    56,
    18
),
(
    (SELECT id FROM users ORDER BY RANDOM() LIMIT 1),
    (SELECT id FROM categories WHERE slug = 'writing-translation' LIMIT 1),
    'Translate Marketing Materials to Spanish',
    'Need professional translation of website content, brochures, and marketing materials from English to Spanish for Latin American market expansion.',
    'Native Spanish speaker, marketing translation experience, and cultural adaptation skills.',
    500.00,
    800.00,
    CURRENT_DATE + INTERVAL '12 days',
    'Remote',
    true,
    'open',
    'normal',
    ARRAY['Spanish Translation', 'Marketing Translation', 'Localization'],
    29,
    6
),

-- Digital Marketing Jobs
(
    (SELECT id FROM users ORDER BY RANDOM() LIMIT 1),
    (SELECT id FROM categories WHERE slug = 'digital-marketing' LIMIT 1),
    'Setup and Manage Google Ads Campaign',
    'Looking for a Google Ads expert to create and manage PPC campaigns for my online course business. Need keyword research, ad creation, and ongoing optimization.',
    'Google Ads certification, proven track record with PPC campaigns, and experience in education/course marketing.',
    600.00,
    1200.00,
    CURRENT_DATE + INTERVAL '5 days',
    'Remote',
    true,
    'open',
    'high',
    ARRAY['Google Ads', 'PPC', 'Keyword Research', 'Campaign Management'],
    41,
    11
),
(
    (SELECT id FROM users ORDER BY RANDOM() LIMIT 1),
    (SELECT id FROM categories WHERE slug = 'digital-marketing' LIMIT 1),
    'Social Media Strategy and Content Calendar',
    'Need a comprehensive social media strategy and 3-month content calendar for Instagram, Facebook, and LinkedIn for my consulting business.',
    'Social media marketing experience, content strategy skills, and knowledge of B2B marketing.',
    400.00,
    800.00,
    CURRENT_DATE + INTERVAL '14 days',
    'Chicago, IL',
    true,
    'open',
    'normal',
    ARRAY['Social Media Marketing', 'Content Strategy', 'B2B Marketing'],
    38,
    7
),

-- Video & Animation Jobs
(
    (SELECT id FROM users ORDER BY RANDOM() LIMIT 1),
    (SELECT id FROM categories WHERE slug = 'video-animation' LIMIT 1),
    'Create Animated Explainer Video',
    'Need a 2-minute animated explainer video for my SaaS product. Should include voiceover, custom animations, and match our brand guidelines.',
    'Experience with After Effects or similar animation software, voiceover coordination, and SaaS product videos.',
    1500.00,
    3000.00,
    CURRENT_DATE + INTERVAL '25 days',
    'Remote',
    true,
    'open',
    'normal',
    ARRAY['After Effects', 'Animation', 'Voiceover', 'Video Production'],
    52,
    13
),
(
    (SELECT id FROM users ORDER BY RANDOM() LIMIT 1),
    (SELECT id FROM categories WHERE slug = 'video-animation' LIMIT 1),
    'Edit Wedding Highlight Reel',
    'Looking for a skilled video editor to create a 5-minute wedding highlight reel from 8 hours of raw footage. Need quick turnaround.',
    'Professional video editing experience, wedding video expertise, and fast delivery capability.',
    300.00,
    600.00,
    CURRENT_DATE + INTERVAL '3 days',
    'Los Angeles, CA',
    false,
    'open',
    'urgent',
    ARRAY['Video Editing', 'Premiere Pro', 'Color Grading', 'Audio Sync'],
    19,
    5
),

-- Data Entry & Admin Jobs
(
    (SELECT id FROM users ORDER BY RANDOM() LIMIT 1),
    (SELECT id FROM categories WHERE slug = 'data-entry' LIMIT 1),
    'Data Entry for Customer Database',
    'Need someone to input 2000 customer records from PDF files into our CRM system. Accuracy is crucial as this data will be used for marketing campaigns.',
    'Excellent attention to detail, fast typing speed, and experience with CRM systems.',
    250.00,
    400.00,
    CURRENT_DATE + INTERVAL '8 days',
    'Remote',
    true,
    'open',
    'normal',
    ARRAY['Data Entry', 'CRM', 'Attention to Detail', 'Excel'],
    31,
    14
),

-- Mobile App Development
(
    (SELECT id FROM users ORDER BY RANDOM() LIMIT 1),
    (SELECT id FROM categories WHERE slug = 'mobile-development' LIMIT 1),
    'Build iOS Fitness Tracking App',
    'Looking for an experienced iOS developer to build a fitness tracking app with workout logging, progress charts, and social features. Need clean UI/UX.',
    'Swift programming, iOS development experience, Core Data knowledge, and fitness app experience preferred.',
    3000.00,
    5000.00,
    CURRENT_DATE + INTERVAL '45 days',
    'Austin, TX',
    true,
    'open',
    'high',
    ARRAY['Swift', 'iOS Development', 'Core Data', 'UI/UX Design'],
    73,
    22
),

-- Tutoring & Education
(
    (SELECT id FROM users ORDER BY RANDOM() LIMIT 1),
    (SELECT id FROM categories WHERE slug = 'tutoring' LIMIT 1),
    'Online Math Tutoring for High School Student',
    'Need an experienced math tutor for my daughter who is struggling with calculus. Looking for 2 sessions per week via video call.',
    'Strong calculus knowledge, teaching experience, patience with teenagers, and reliable internet connection.',
    40.00,
    60.00,
    CURRENT_DATE + INTERVAL '60 days',
    'Remote',
    true,
    'open',
    'normal',
    ARRAY['Mathematics', 'Calculus', 'Online Tutoring', 'Teaching'],
    25,
    8
),

-- Photography
(
    (SELECT id FROM users ORDER BY RANDOM() LIMIT 1),
    (SELECT id FROM categories WHERE slug = 'photography' LIMIT 1),
    'Product Photography for E-commerce',
    'Need professional product photos for 50 jewelry items for my online store. Require white background shots and lifestyle photos.',
    'Product photography experience, professional lighting setup, and jewelry photography portfolio.',
    800.00,
    1200.00,
    CURRENT_DATE + INTERVAL '10 days',
    'Miami, FL',
    false,
    'open',
    'normal',
    ARRAY['Product Photography', 'Jewelry Photography', 'Photo Editing', 'Lighting'],
    44,
    9
),

-- Virtual Assistant
(
    (SELECT id FROM users ORDER BY RANDOM() LIMIT 1),
    (SELECT id FROM categories WHERE slug = 'virtual-assistant' LIMIT 1),
    'Virtual Assistant for Email Management',
    'Looking for a reliable VA to manage my email inbox, schedule appointments, and handle basic customer service inquiries. 20 hours per week.',
    'Excellent English communication, email management experience, calendar scheduling skills, and customer service background.',
    15.00,
    25.00,
    CURRENT_DATE + INTERVAL '7 days',
    'Remote',
    true,
    'open',
    'normal',
    ARRAY['Email Management', 'Customer Service', 'Scheduling', 'Communication'],
    36,
    16
);

-- Update some jobs to different statuses for variety
UPDATE microjobs SET status = 'in_progress', applications_count = applications_count + 5 
WHERE title IN ('Fix WordPress Plugin Compatibility Issues', 'Edit Wedding Highlight Reel');

UPDATE microjobs SET status = 'completed' 
WHERE title = 'Create Social Media Graphics Package';

-- Add some additional views to make it more realistic
UPDATE microjobs SET views_count = views_count + (RANDOM() * 50)::INTEGER;
