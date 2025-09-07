-- Chat-based money transfer system
-- Extends existing wallet system for peer-to-peer transfers in chat

-- Chat money transfers table
CREATE TABLE IF NOT EXISTS chat_money_transfers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
    commission_amount DECIMAL(12,2) DEFAULT 0.00,
    net_amount DECIMAL(12,2) NOT NULL,
    message TEXT,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'completed', 'failed', 'cancelled'
    transaction_id UUID REFERENCES wallet_transactions(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT different_users CHECK (sender_id != receiver_id)
);

-- Support ticket system with tiered pricing
CREATE TABLE IF NOT EXISTS support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    chat_id UUID REFERENCES chats(id) ON DELETE SET NULL,
    ticket_type VARCHAR(20) NOT NULL DEFAULT 'free', -- 'free', 'priority'
    subject VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    priority VARCHAR(20) DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
    status VARCHAR(20) DEFAULT 'open', -- 'open', 'in_progress', 'resolved', 'closed'
    assigned_admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
    payment_amount DECIMAL(10,2) DEFAULT 0.00,
    payment_transaction_id UUID REFERENCES wallet_transactions(id),
    response_time_hours INTEGER, -- Expected response time based on type
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    first_response_at TIMESTAMP WITH TIME ZONE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    closed_at TIMESTAMP WITH TIME ZONE
);

-- Support ticket messages
CREATE TABLE IF NOT EXISTS support_ticket_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    is_admin_response BOOLEAN DEFAULT FALSE,
    attachments JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Support pricing settings
CREATE TABLE IF NOT EXISTS support_pricing_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    support_type VARCHAR(20) NOT NULL UNIQUE, -- 'free', 'priority'
    price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    response_time_hours INTEGER NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default support pricing
INSERT INTO support_pricing_settings (support_type, price, response_time_hours, description, is_active)
VALUES 
    ('free', 0.00, 48, '24-72 hour response time for free support', true),
    ('priority', 0.20, 1, 'Priority support with response within 1 hour', true)
ON CONFLICT (support_type) DO NOTHING;

-- Enhanced commission settings for chat transfers
INSERT INTO admin_fee_settings (fee_type, fee_percentage, fee_fixed, minimum_fee, is_active) 
VALUES 
    ('chat_transfer', 2.00, 0.00, 0.05, true)
ON CONFLICT (fee_type) DO NOTHING;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_chat_money_transfers_chat_id ON chat_money_transfers(chat_id);
CREATE INDEX IF NOT EXISTS idx_chat_money_transfers_sender_id ON chat_money_transfers(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_money_transfers_receiver_id ON chat_money_transfers(receiver_id);
CREATE INDEX IF NOT EXISTS idx_chat_money_transfers_status ON chat_money_transfers(status);

CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_ticket_type ON support_tickets(ticket_type);
CREATE INDEX IF NOT EXISTS idx_support_tickets_assigned_admin_id ON support_tickets(assigned_admin_id);

CREATE INDEX IF NOT EXISTS idx_support_ticket_messages_ticket_id ON support_ticket_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_support_ticket_messages_sender_id ON support_ticket_messages(sender_id);
