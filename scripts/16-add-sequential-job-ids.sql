-- Add sequential job ID column to microjobs table
ALTER TABLE microjobs ADD COLUMN job_number SERIAL;

-- Create a unique index on job_number
CREATE UNIQUE INDEX idx_microjobs_job_number ON microjobs(job_number);

-- Update existing jobs to have sequential numbers starting from 1
UPDATE microjobs SET job_number = nextval('microjobs_job_number_seq');

-- Create a function to format job numbers with leading zeros
CREATE OR REPLACE FUNCTION format_job_number(job_num INTEGER) 
RETURNS TEXT AS $$
BEGIN
    RETURN LPAD(job_num::TEXT, 3, '0');
END;
$$ LANGUAGE plpgsql;
