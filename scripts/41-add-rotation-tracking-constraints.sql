-- Add unique constraint and additional indexes for microjob rotation tracking
ALTER TABLE microjob_rotation_tracking 
ADD CONSTRAINT unique_job_rotation UNIQUE (job_id);

-- Add trigger to update jobs table when worker count changes (for algorithm priority)
CREATE OR REPLACE FUNCTION update_job_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the job's updated_at timestamp when worker applications change
  UPDATE jobs 
  SET updated_at = NOW() 
  WHERE id = NEW.job_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for job applications to update job priority
DROP TRIGGER IF EXISTS trigger_update_job_timestamp ON job_applications;
CREATE TRIGGER trigger_update_job_timestamp
  AFTER INSERT OR UPDATE ON job_applications
  FOR EACH ROW
  EXECUTE FUNCTION update_job_timestamp();

-- Create function to rotate jobs for time-based algorithm
CREATE OR REPLACE FUNCTION rotate_microjobs()
RETURNS void AS $$
DECLARE
  settings_record RECORD;
  rotation_interval INTERVAL;
BEGIN
  -- Get current algorithm settings
  SELECT * INTO settings_record 
  FROM microjob_algorithm_settings 
  ORDER BY created_at DESC 
  LIMIT 1;
  
  -- Only proceed if time rotation is enabled
  IF settings_record.algorithm_type = 'time_rotation' AND settings_record.is_enabled THEN
    rotation_interval := (settings_record.rotation_hours || ' hours')::INTERVAL;
    
    -- Update rotation tracking for jobs that need to rotate
    UPDATE microjob_rotation_tracking 
    SET 
      last_front_page_at = NOW(),
      rotation_cycle = rotation_cycle + 1,
      updated_at = NOW()
    WHERE last_front_page_at < (NOW() - rotation_interval);
    
    -- Insert tracking for new jobs that don't have records yet
    INSERT INTO microjob_rotation_tracking (job_id, last_front_page_at, rotation_cycle)
    SELECT j.id, NOW() - rotation_interval, 1
    FROM jobs j
    LEFT JOIN microjob_rotation_tracking mrt ON j.id = mrt.job_id
    WHERE j.status IN ('approved', 'open') 
    AND mrt.job_id IS NULL;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to run rotation (this would typically be set up with pg_cron or external scheduler)
-- For now, we'll create the function that can be called manually or via cron
COMMENT ON FUNCTION rotate_microjobs() IS 'Call this function periodically to rotate microjobs in time-based algorithm';
