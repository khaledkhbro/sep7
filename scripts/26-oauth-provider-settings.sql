-- OAuth Provider Settings Schema
-- This script creates tables for managing OAuth provider configurations and user connections

-- Create OAuth provider settings table
CREATE TABLE IF NOT EXISTS oauth_provider_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_name VARCHAR(50) NOT NULL UNIQUE, -- 'google', 'facebook', 'twitter', etc.
    client_id VARCHAR(255) NOT NULL,
    client_secret VARCHAR(255) NOT NULL,
    redirect_uri VARCHAR(500) NOT NULL,
    scope VARCHAR(500) DEFAULT '',
    is_enabled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user OAuth connections table
CREATE TABLE IF NOT EXISTS user_oauth_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider_name VARCHAR(50) NOT NULL,
    provider_user_id VARCHAR(255) NOT NULL,
    provider_email VARCHAR(255),
    provider_name_field VARCHAR(255),
    access_token TEXT,
    refresh_token TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, provider_name),
    UNIQUE(provider_name, provider_user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_oauth_provider_settings_provider_name ON oauth_provider_settings(provider_name);
CREATE INDEX IF NOT EXISTS idx_oauth_provider_settings_enabled ON oauth_provider_settings(is_enabled);
CREATE INDEX IF NOT EXISTS idx_user_oauth_connections_user_id ON user_oauth_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_user_oauth_connections_provider ON user_oauth_connections(provider_name);
CREATE INDEX IF NOT EXISTS idx_user_oauth_connections_provider_user_id ON user_oauth_connections(provider_name, provider_user_id);

-- Insert default OAuth provider configurations (disabled by default)
INSERT INTO oauth_provider_settings (provider_name, client_id, client_secret, redirect_uri, scope, is_enabled)
VALUES 
    ('google', '', '', '', 'openid email profile', FALSE),
    ('facebook', '', '', '', 'email public_profile', FALSE),
    ('twitter', '', '', '', 'users.read tweet.read', FALSE)
ON CONFLICT (provider_name) DO NOTHING;

-- Add OAuth provider field to users table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'oauth_provider') THEN
        ALTER TABLE users ADD COLUMN oauth_provider VARCHAR(50) DEFAULT NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'oauth_user_id') THEN
        ALTER TABLE users ADD COLUMN oauth_user_id VARCHAR(255) DEFAULT NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'email_verified') THEN
        ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Create index for OAuth fields on users table
CREATE INDEX IF NOT EXISTS idx_users_oauth_provider ON users(oauth_provider);
CREATE INDEX IF NOT EXISTS idx_users_oauth_user_id ON users(oauth_user_id);

COMMENT ON TABLE oauth_provider_settings IS 'Stores OAuth provider configurations for social authentication';
COMMENT ON TABLE user_oauth_connections IS 'Stores user connections to OAuth providers';
COMMENT ON COLUMN oauth_provider_settings.provider_name IS 'Name of the OAuth provider (google, facebook, twitter, etc.)';
COMMENT ON COLUMN oauth_provider_settings.client_id IS 'OAuth client ID from the provider';
COMMENT ON COLUMN oauth_provider_settings.client_secret IS 'OAuth client secret from the provider';
COMMENT ON COLUMN oauth_provider_settings.redirect_uri IS 'OAuth redirect URI for the provider';
COMMENT ON COLUMN oauth_provider_settings.scope IS 'OAuth scopes requested from the provider';
COMMENT ON COLUMN oauth_provider_settings.is_enabled IS 'Whether this OAuth provider is enabled';
COMMENT ON COLUMN user_oauth_connections.provider_user_id IS 'User ID from the OAuth provider';
COMMENT ON COLUMN user_oauth_connections.provider_email IS 'Email from the OAuth provider';
COMMENT ON COLUMN user_oauth_connections.provider_name_field IS 'Name from the OAuth provider';
