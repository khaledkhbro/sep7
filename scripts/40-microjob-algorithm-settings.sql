-- Create microjob algorithm settings table
CREATE TABLE IF NOT EXISTS microjob_algorithm_settings (
  id SERIAL PRIMARY KEY,
  algorithm_type VARCHAR(50) NOT NULL DEFAULT 'newest_first',
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  rotation_hours INTEGER DEFAULT 8,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create microjob rotation tracking table
CREATE TABLE IF NOT EXISTS microjob_rotation_tracking (
  id SERIAL PRIMARY KEY,
  job_id INTEGER NOT NULL,
  last_front_page_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  front_page_duration_minutes INTEGER DEFAULT 0,
  rotation_cycle INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default settings
INSERT INTO microjob_algorithm_settings (algorithm_type, is_enabled, rotation_hours)
VALUES ('newest_first', true, 8)
ON CONFLICT DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_microjob_rotation_job_id ON microjob_rotation_tracking(job_id);
CREATE INDEX IF NOT EXISTS idx_microjob_rotation_last_front_page ON microjob_rotation_tracking(last_front_page_at);
CREATE INDEX IF NOT EXISTS idx_microjob_rotation_cycle ON microjob_rotation_tracking(rotation_cycle);
