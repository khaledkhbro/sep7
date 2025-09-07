-- Add unique constraint to prevent duplicate transactions with same reference
-- This ensures database-level protection against duplicate refunds

-- First, let's check if we have any existing duplicate transactions
-- and clean them up if needed

-- Create a unique index on wallet transactions to prevent duplicates
-- based on reference_id and reference_type combination
CREATE UNIQUE INDEX IF NOT EXISTS idx_wallet_transactions_unique_reference 
ON wallet_transactions (reference_id, reference_type) 
WHERE reference_id IS NOT NULL AND reference_type IS NOT NULL;

-- Add a check constraint to ensure transaction amounts are reasonable
ALTER TABLE wallet_transactions 
ADD CONSTRAINT chk_transaction_amount_reasonable 
CHECK (amount BETWEEN -10000 AND 10000);

-- Add a check constraint to ensure fee amounts are non-negative
ALTER TABLE wallet_transactions 
ADD CONSTRAINT chk_fee_amount_non_negative 
CHECK (fee_amount >= 0);

-- Create an index on dispute status to improve query performance
CREATE INDEX IF NOT EXISTS idx_disputes_status ON disputes (status);

-- Create an index on dispute reference lookups
CREATE INDEX IF NOT EXISTS idx_disputes_job_worker ON disputes (job_id, worker_id);

-- Log the constraint creation
INSERT INTO admin_logs (action, details, created_at) 
VALUES (
  'database_constraint_added', 
  'Added unique constraints and indexes to prevent duplicate transactions and improve dispute resolution performance',
  NOW()
);
