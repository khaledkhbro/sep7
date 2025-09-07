-- Job Reservation System
-- Allows users to reserve microjobs for a specified time period

-- Job reservations table
CREATE TABLE job_reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES microjobs(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reserved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'expired', 'completed', 'cancelled'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(job_id) -- Only one active reservation per job
);

-- Admin settings for reservation system
CREATE TABLE reservation_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    is_enabled BOOLEAN DEFAULT TRUE,
    default_reservation_hours INTEGER DEFAULT 1,
    max_reservation_hours INTEGER DEFAULT 24,
    max_concurrent_reservations INTEGER DEFAULT 5, -- Max jobs a user can reserve at once
    notification_threshold INTEGER DEFAULT 3, -- Notify admin if user has this many expired reservations
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Track user reservation violations for admin notifications
CREATE TABLE reservation_violations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    violation_type VARCHAR(50) NOT NULL, -- 'multiple_expired', 'excessive_reservations'
    violation_count INTEGER DEFAULT 1,
    details JSONB, -- Store additional violation details
    is_resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- Add reservation-related columns to microjobs table
ALTER TABLE microjobs 
ADD COLUMN is_reserved BOOLEAN DEFAULT FALSE,
ADD COLUMN reserved_by UUID REFERENCES users(id),
ADD COLUMN reserved_until TIMESTAMP WITH TIME ZONE;

-- Indexes for better performance
CREATE INDEX idx_job_reservations_job_id ON job_reservations(job_id);
CREATE INDEX idx_job_reservations_user_id ON job_reservations(user_id);
CREATE INDEX idx_job_reservations_expires_at ON job_reservations(expires_at);
CREATE INDEX idx_job_reservations_status ON job_reservations(status);
CREATE INDEX idx_microjobs_is_reserved ON microjobs(is_reserved);
CREATE INDEX idx_microjobs_reserved_until ON microjobs(reserved_until);
CREATE INDEX idx_reservation_violations_user_id ON reservation_violations(user_id);

-- Insert default reservation settings
INSERT INTO reservation_settings (is_enabled, default_reservation_hours, max_reservation_hours, max_concurrent_reservations, notification_threshold)
VALUES (TRUE, 1, 24, 5, 3);

-- Function to automatically expire reservations
CREATE OR REPLACE FUNCTION expire_job_reservations()
RETURNS void AS $$
BEGIN
    -- Update expired reservations
    UPDATE job_reservations 
    SET status = 'expired', updated_at = NOW()
    WHERE status = 'active' AND expires_at < NOW();
    
    -- Update microjobs to remove expired reservations
    UPDATE microjobs 
    SET is_reserved = FALSE, reserved_by = NULL, reserved_until = NULL, updated_at = NOW()
    WHERE is_reserved = TRUE AND reserved_until < NOW();
    
    -- Create violation records for users with multiple expired reservations
    INSERT INTO reservation_violations (user_id, violation_type, violation_count, details)
    SELECT 
        user_id,
        'multiple_expired',
        COUNT(*),
        jsonb_build_object('expired_jobs', array_agg(job_id), 'date', NOW())
    FROM job_reservations 
    WHERE status = 'expired' 
        AND updated_at >= NOW() - INTERVAL '1 hour' -- Only recent expirations
    GROUP BY user_id
    HAVING COUNT(*) >= (SELECT notification_threshold FROM reservation_settings LIMIT 1)
    ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql;
