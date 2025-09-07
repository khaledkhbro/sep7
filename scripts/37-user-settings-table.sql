-- Create user_settings table for storing user preferences
CREATE TABLE IF NOT EXISTS user_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Account Settings
    language VARCHAR(10) DEFAULT 'en',
    timezone VARCHAR(50) DEFAULT 'UTC',
    currency VARCHAR(10) DEFAULT 'USD',
    two_factor_enabled BOOLEAN DEFAULT false,
    
    -- Email Notification Settings
    email_notifications BOOLEAN DEFAULT true,
    job_alerts BOOLEAN DEFAULT true,
    message_notifications BOOLEAN DEFAULT true,
    marketing_emails BOOLEAN DEFAULT false,
    weekly_digest BOOLEAN DEFAULT true,
    
    -- Push Notification Settings
    push_notifications BOOLEAN DEFAULT true,
    push_job_updates BOOLEAN DEFAULT true,
    push_messages BOOLEAN DEFAULT true,
    push_payments BOOLEAN DEFAULT true,
    push_referrals BOOLEAN DEFAULT true,
    push_system_alerts BOOLEAN DEFAULT true,
    push_marketing BOOLEAN DEFAULT false,
    
    -- Privacy Settings
    profile_visibility VARCHAR(20) DEFAULT 'public',
    show_email BOOLEAN DEFAULT false,
    show_phone BOOLEAN DEFAULT false,
    allow_direct_messages BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);

-- Enable RLS
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own settings" ON user_settings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings" ON user_settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings" ON user_settings
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own settings" ON user_settings
    FOR DELETE USING (auth.uid() = user_id);
