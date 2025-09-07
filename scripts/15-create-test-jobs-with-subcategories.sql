-- Create test jobs with proper subcategory assignments and thumbnails

-- First, let's create some categories and subcategories with thumbnails
INSERT INTO categories (id, name, slug, description, thumbnail, minimum_payment, sort_order, is_active, created_at, updated_at) 
VALUES 
  ('test_social_media', 'Social Media', 'social-media', 'Social media engagement tasks', 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=300&h=200&fit=crop', 0.50, 1, true, NOW(), NOW()),
  ('test_content_creation', 'Content Creation', 'content-creation', 'Content writing and creation tasks', 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=300&h=200&fit=crop', 1.00, 2, true, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  thumbnail = EXCLUDED.thumbnail,
  updated_at = NOW();

-- Create subcategories with specific thumbnails
INSERT INTO subcategories (id, category_id, name, slug, description, thumbnail, minimum_payment, sort_order, is_active, created_at, updated_at)
VALUES 
  ('test_facebook', 'test_social_media', 'Facebook Tasks', 'facebook', 'Facebook likes, shares, and engagement', 'https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?w=300&h=200&fit=crop', 0.50, 1, true, NOW(), NOW()),
  ('test_instagram', 'test_social_media', 'Instagram Tasks', 'instagram', 'Instagram likes, follows, and stories', 'https://images.unsplash.com/photo-1611162618071-b39a2ec055fb?w=300&h=200&fit=crop', 0.75, 2, true, NOW(), NOW()),
  ('test_blog_writing', 'test_content_creation', 'Blog Writing', 'blog-writing', 'Blog posts and articles', 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=300&h=200&fit=crop', 2.00, 1, true, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  thumbnail = EXCLUDED.thumbnail,
  updated_at = NOW();

-- Create test jobs with proper subcategory assignments
INSERT INTO jobs (id, title, description, requirements, instructions, category_id, subcategory_id, budget_min, budget_max, workers_needed, deadline, location, tags, attachments, user_id, payment_type, status, estimated_total_cost, deposit_deducted, require_screenshots, screenshot_cost, estimated_approval_days, created_at, updated_at)
VALUES 
  ('test_job_facebook_1', 'Like and Share Facebook Post', 'Steps to complete:\n1. Like the specified Facebook post\n2. Share the post to your timeline\n3. Take a screenshot as proof', 'Screenshot of liked and shared post', 'Step 1: Like the Facebook post\nStep 2: Share to your timeline\nStep 3: Screenshot for proof', 'test_social_media', 'test_facebook', 1.00, 1.00, 10, '2025-08-25', 'Remote', '[]', '[]', '02', 'instant', 'approved', 10.00, 10.50, 1, 0.50, 2, NOW(), NOW()),
  
  ('test_job_instagram_1', 'Follow Instagram Account and Like Posts', 'Steps to complete:\n1. Follow the specified Instagram account\n2. Like the last 5 posts\n3. Take screenshots as proof', 'Screenshots of follow and likes', 'Step 1: Follow the Instagram account\nStep 2: Like the last 5 posts\nStep 3: Take screenshots', 'test_social_media', 'test_instagram', 1.50, 1.50, 8, '2025-08-26', 'Remote', '[]', '[]', '02', 'instant', 'approved', 12.00, 12.60, 2, 1.00, 1, NOW(), NOW()),
  
  ('test_job_blog_1', 'Write 500-word Blog Post', 'Steps to complete:\n1. Research the given topic\n2. Write a 500-word blog post\n3. Submit the final document', 'Complete blog post document', 'Step 1: Research the topic thoroughly\nStep 2: Write engaging 500-word content\nStep 3: Proofread and submit', 'test_content_creation', 'test_blog_writing', 5.00, 5.00, 3, '2025-08-27', 'Remote', '[]', '[]', '03', 'instant', 'approved', 15.00, 15.75, 0, 0.00, 3, NOW(), NOW()),
  
  ('test_job_facebook_2', 'Facebook Page Review and Rating', 'Steps to complete:\n1. Visit the Facebook business page\n2. Leave a 5-star review\n3. Write a positive comment', 'Screenshot of review and comment', 'Step 1: Visit the Facebook page\nStep 2: Rate 5 stars\nStep 3: Write positive review', 'test_social_media', 'test_facebook', 0.75, 0.75, 15, '2025-08-24', 'Remote', '[]', '[]', '02', 'instant', 'approved', 11.25, 11.81, 1, 0.56, 1, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  subcategory_id = EXCLUDED.subcategory_id,
  status = 'approved',
  updated_at = NOW();
