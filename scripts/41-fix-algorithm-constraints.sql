-- Add unique constraint for job_id in rotation tracking to prevent duplicates
ALTER TABLE microjob_rotation_tracking 
ADD CONSTRAINT unique_job_rotation UNIQUE (job_id);

-- Ensure we have at least one settings record
INSERT INTO microjob_algorithm_settings (algorithm_type, is_enabled, rotation_hours)
VALUES ('newest_first', true, 8)
ON CONFLICT DO NOTHING;
