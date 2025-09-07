-- OAuth Provider Management Functions
-- This script creates stored procedures for managing OAuth provider settings

-- Function to get OAuth provider settings
CREATE OR REPLACE FUNCTION get_oauth_provider_settings(p_provider_name VARCHAR DEFAULT NULL)
RETURNS TABLE (
    id UUID,
    provider_name VARCHAR,
    client_id VARCHAR,
    redirect_uri VARCHAR,
    scope VARCHAR,
    is_enabled BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    IF p_provider_name IS NOT NULL THEN
        RETURN QUERY
        SELECT 
            ops.id,
            ops.provider_name,
            ops.client_id,
            ops.redirect_uri,
            ops.scope,
            ops.is_enabled,
            ops.created_at,
            ops.updated_at
        FROM oauth_provider_settings ops
        WHERE ops.provider_name = p_provider_name;
    ELSE
        RETURN QUERY
        SELECT 
            ops.id,
            ops.provider_name,
            ops.client_id,
            ops.redirect_uri,
            ops.scope,
            ops.is_enabled,
            ops.created_at,
            ops.updated_at
        FROM oauth_provider_settings ops
        ORDER BY ops.provider_name;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to update OAuth provider settings
CREATE OR REPLACE FUNCTION update_oauth_provider_settings(
    p_provider_name VARCHAR,
    p_client_id VARCHAR,
    p_client_secret VARCHAR,
    p_redirect_uri VARCHAR,
    p_scope VARCHAR DEFAULT NULL,
    p_is_enabled BOOLEAN DEFAULT FALSE
)
RETURNS BOOLEAN AS $$
DECLARE
    rows_affected INTEGER;
BEGIN
    UPDATE oauth_provider_settings
    SET 
        client_id = p_client_id,
        client_secret = p_client_secret,
        redirect_uri = p_redirect_uri,
        scope = COALESCE(p_scope, scope),
        is_enabled = p_is_enabled,
        updated_at = NOW()
    WHERE provider_name = p_provider_name;
    
    GET DIAGNOSTICS rows_affected = ROW_COUNT;
    
    -- If no rows were updated, insert a new record
    IF rows_affected = 0 THEN
        INSERT INTO oauth_provider_settings (
            provider_name, client_id, client_secret, redirect_uri, scope, is_enabled
        ) VALUES (
            p_provider_name, p_client_id, p_client_secret, p_redirect_uri, 
            COALESCE(p_scope, ''), p_is_enabled
        );
    END IF;
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Function to get user OAuth connections
CREATE OR REPLACE FUNCTION get_user_oauth_connections(p_user_id UUID)
RETURNS TABLE (
    id UUID,
    provider_name VARCHAR,
    provider_user_id VARCHAR,
    provider_email VARCHAR,
    provider_name_field VARCHAR,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        uoc.id,
        uoc.provider_name,
        uoc.provider_user_id,
        uoc.provider_email,
        uoc.provider_name_field,
        uoc.created_at
    FROM user_oauth_connections uoc
    WHERE uoc.user_id = p_user_id
    ORDER BY uoc.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to create or update user OAuth connection
CREATE OR REPLACE FUNCTION upsert_user_oauth_connection(
    p_user_id UUID,
    p_provider_name VARCHAR,
    p_provider_user_id VARCHAR,
    p_provider_email VARCHAR DEFAULT NULL,
    p_provider_name_field VARCHAR DEFAULT NULL,
    p_access_token TEXT DEFAULT NULL,
    p_refresh_token TEXT DEFAULT NULL,
    p_expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    connection_id UUID;
BEGIN
    INSERT INTO user_oauth_connections (
        user_id, provider_name, provider_user_id, provider_email, 
        provider_name_field, access_token, refresh_token, expires_at
    ) VALUES (
        p_user_id, p_provider_name, p_provider_user_id, p_provider_email,
        p_provider_name_field, p_access_token, p_refresh_token, p_expires_at
    )
    ON CONFLICT (user_id, provider_name) 
    DO UPDATE SET
        provider_user_id = EXCLUDED.provider_user_id,
        provider_email = EXCLUDED.provider_email,
        provider_name_field = EXCLUDED.provider_name_field,
        access_token = EXCLUDED.access_token,
        refresh_token = EXCLUDED.refresh_token,
        expires_at = EXCLUDED.expires_at,
        updated_at = NOW()
    RETURNING id INTO connection_id;
    
    RETURN connection_id;
END;
$$ LANGUAGE plpgsql;

-- Function to find user by OAuth provider
CREATE OR REPLACE FUNCTION find_user_by_oauth_provider(
    p_provider_name VARCHAR,
    p_provider_user_id VARCHAR
)
RETURNS TABLE (
    user_id UUID,
    email VARCHAR,
    username VARCHAR,
    full_name VARCHAR,
    is_active BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id,
        u.email,
        u.username,
        u.full_name,
        u.is_active
    FROM users u
    INNER JOIN user_oauth_connections uoc ON u.id = uoc.user_id
    WHERE uoc.provider_name = p_provider_name 
    AND uoc.provider_user_id = p_provider_user_id;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_oauth_provider_settings(VARCHAR) TO PUBLIC;
GRANT EXECUTE ON FUNCTION update_oauth_provider_settings(VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, BOOLEAN) TO PUBLIC;
GRANT EXECUTE ON FUNCTION get_user_oauth_connections(UUID) TO PUBLIC;
GRANT EXECUTE ON FUNCTION upsert_user_oauth_connection(UUID, VARCHAR, VARCHAR, VARCHAR, VARCHAR, TEXT, TEXT, TIMESTAMP WITH TIME ZONE) TO PUBLIC;
GRANT EXECUTE ON FUNCTION find_user_by_oauth_provider(VARCHAR, VARCHAR) TO PUBLIC;
