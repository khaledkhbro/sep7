-- Add instant payment workflow support

-- Add instant payment option to jobs
ALTER TABLE microjobs 
ADD COLUMN IF NOT EXISTS instant_payment_enabled BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS requires_proof_submission BOOLEAN DEFAULT FALSE;

-- Update job applications to track instant payments
ALTER TABLE job_applications 
ADD COLUMN IF NOT EXISTS instant_payment_processed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS payment_processed_at TIMESTAMP WITH TIME ZONE;

-- Add instant payment transactions table
CREATE TABLE IF NOT EXISTS instant_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES microjobs(id) ON DELETE CASCADE,
    application_id UUID NOT NULL REFERENCES job_applications(id) ON DELETE CASCADE,
    employer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    worker_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    payment_amount DECIMAL(10,2) NOT NULL,
    platform_fee DECIMAL(10,2) NOT NULL,
    worker_amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'completed', -- 'completed', 'failed', 'refunded'
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_instant_payments_job_id ON instant_payments(job_id);
CREATE INDEX IF NOT EXISTS idx_instant_payments_worker_id ON instant_payments(worker_id);
CREATE INDEX IF NOT EXISTS idx_instant_payments_employer_id ON instant_payments(employer_id);

-- Update existing jobs to enable instant payment by default
UPDATE microjobs 
SET instant_payment_enabled = TRUE, 
    requires_proof_submission = FALSE 
WHERE instant_payment_enabled IS NULL;
