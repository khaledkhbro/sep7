-- Create sample achievements for both VIP and Normal referrals
INSERT INTO referral_achievements (
  id,
  name,
  description,
  referral_type,
  referral_requirement,
  reward_amount,
  is_active,
  created_at
) VALUES 
-- VIP Referral Achievements
(
  gen_random_uuid(),
  'VIP Starter',
  'Refer your first VIP member and earn a bonus! VIP members are those who complete 3+ jobs or make a deposit.',
  'vip',
  1,
  5.00,
  true,
  NOW()
),
(
  gen_random_uuid(),
  'VIP Bronze',
  'Build your VIP network by referring 3 VIP members. Each VIP referral brings quality users to our platform.',
  'vip',
  3,
  15.00,
  true,
  NOW()
),
(
  gen_random_uuid(),
  'VIP Silver',
  'Reach 5 VIP referrals and unlock silver status! Your network is growing strong.',
  'vip',
  5,
  30.00,
  true,
  NOW()
),
(
  gen_random_uuid(),
  'VIP Gold',
  'Achieve 10 VIP referrals and earn gold status. You are becoming a top referrer!',
  'vip',
  10,
  75.00,
  true,
  NOW()
),
(
  gen_random_uuid(),
  'VIP Platinum',
  'The ultimate achievement: 20 VIP referrals! You are now a platinum referrer with exclusive benefits.',
  'vip',
  20,
  200.00,
  true,
  NOW()
),

-- Normal Referral Achievements
(
  gen_random_uuid(),
  'First Steps',
  'Welcome to referrals! Invite your first friend to join our platform and start earning.',
  'normal',
  1,
  1.00,
  true,
  NOW()
),
(
  gen_random_uuid(),
  'Growing Network',
  'Expand your network by referring 5 people. Every referral helps grow our community!',
  'normal',
  5,
  5.00,
  true,
  NOW()
),
(
  gen_random_uuid(),
  'Community Builder',
  'Refer 10 people and become a community builder. Your network is making a real impact!',
  'normal',
  10,
  12.00,
  true,
  NOW()
),
(
  gen_random_uuid(),
  'Super Referrer',
  'Reach 25 referrals and earn super referrer status. You are helping us grow exponentially!',
  'normal',
  25,
  35.00,
  true,
  NOW()
),
(
  gen_random_uuid(),
  'Referral Master',
  'The ultimate normal referral achievement: 50 referrals! You are a true referral master.',
  'normal',
  50,
  100.00,
  true,
  NOW()
);
