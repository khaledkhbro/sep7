-- Enhanced wallet system with separate deposit and earnings balances
-- Drop existing wallet constraints to modify structure
ALTER TABLE wallets DROP CONSTRAINT IF EXISTS wallets_user_id_key;

-- Add new columns for enhanced wallet functionality
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS deposit_balance DECIMAL(12,2) DEFAULT 0.00;
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS earnings_balance DECIMAL(12,2) DEFAULT 0.00;
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS upcoming_payments DECIMAL(12,2) DEFAULT 0.00;
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS pending_payments DECIMAL(12,2) DEFAULT 0.00;

-- Update existing balance to be deposit_balance for migration
UPDATE wallets SET deposit_balance = balance WHERE deposit_balance = 0.00;

-- Re-add unique constraint
ALTER TABLE wallets ADD CONSTRAINT wallets_user_id_unique UNIQUE(user_id);

-- Admin fee settings table
CREATE TABLE IF NOT EXISTS admin_fee_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fee_type VARCHAR(20) NOT NULL, -- 'deposit', 'withdrawal', 'transaction'
    fee_percentage DECIMAL(5,2) DEFAULT 0.00, -- Percentage fee (0-100)
    fee_fixed DECIMAL(10,2) DEFAULT 0.00, -- Fixed fee amount
    minimum_fee DECIMAL(10,2) DEFAULT 0.00, -- Minimum fee to charge
    maximum_fee DECIMAL(10,2), -- Maximum fee to charge (NULL for no limit)
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(fee_type)
);

-- Insert default fee settings
INSERT INTO admin_fee_settings (fee_type, fee_percentage, fee_fixed, minimum_fee, is_active) 
VALUES 
    ('deposit', 2.50, 0.00, 0.50, true),
    ('withdrawal', 1.00, 0.25, 0.25, true),
    ('transaction', 3.00, 0.00, 0.10, true)
ON CONFLICT (fee_type) DO NOTHING;

-- Enhanced wallet transactions with fee tracking
ALTER TABLE wallet_transactions ADD COLUMN IF NOT EXISTS fee_amount DECIMAL(12,2) DEFAULT 0.00;
ALTER TABLE wallet_transactions ADD COLUMN IF NOT EXISTS net_amount DECIMAL(12,2);
ALTER TABLE wallet_transactions ADD COLUMN IF NOT EXISTS balance_type VARCHAR(20) DEFAULT 'deposit'; -- 'deposit', 'earnings'

-- Update net_amount for existing transactions
UPDATE wallet_transactions SET net_amount = amount WHERE net_amount IS NULL;

-- Payment schedules for upcoming payments
CREATE TABLE IF NOT EXISTS payment_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(12,2) NOT NULL,
    scheduled_date DATE NOT NULL,
    description TEXT,
    reference_id UUID,
    reference_type VARCHAR(50),
    status VARCHAR(20) DEFAULT 'scheduled', -- 'scheduled', 'processed', 'failed', 'cancelled'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE
);

-- Admin fee collection tracking
CREATE TABLE IF NOT EXISTS admin_fee_collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL REFERENCES wallet_transactions(id),
    fee_type VARCHAR(20) NOT NULL,
    original_amount DECIMAL(12,2) NOT NULL,
    fee_percentage DECIMAL(5,2),
    fee_fixed DECIMAL(10,2),
    fee_amount DECIMAL(12,2) NOT NULL,
    collected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
