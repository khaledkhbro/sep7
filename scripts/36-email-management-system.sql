-- Email Management System
-- Comprehensive email provider and template management

-- Email Providers Configuration
CREATE TABLE IF NOT EXISTS email_providers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    type VARCHAR(50) NOT NULL, -- 'smtp', 'api', 'service'
    provider VARCHAR(50) NOT NULL, -- 'ses', 'sendgrid', 'mailgun', 'gmail', 'outlook', 'resend'
    is_active BOOLEAN DEFAULT false,
    is_primary BOOLEAN DEFAULT false,
    priority INTEGER DEFAULT 1,
    
    -- Configuration (JSON)
    config JSONB NOT NULL DEFAULT '{}',
    
    -- Rate Limits
    daily_limit INTEGER DEFAULT 10000,
    monthly_limit INTEGER DEFAULT 100000,
    current_daily_usage INTEGER DEFAULT 0,
    current_monthly_usage INTEGER DEFAULT 0,
    
    -- Status
    status VARCHAR(20) DEFAULT 'inactive', -- 'active', 'inactive', 'error', 'suspended'
    last_error TEXT,
    last_used_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Email Templates
CREATE TABLE IF NOT EXISTS email_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    type VARCHAR(50) NOT NULL, -- 'signup', 'order', 'transaction', 'notification', 'chat'
    subject VARCHAR(255) NOT NULL,
    html_content TEXT NOT NULL,
    text_content TEXT,
    
    -- Template Variables (JSON array of variable names)
    variables JSONB DEFAULT '[]',
    
    -- Styling
    theme VARCHAR(50) DEFAULT 'default',
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Email Queue
CREATE TABLE IF NOT EXISTS email_queue (
    id SERIAL PRIMARY KEY,
    provider_id INTEGER REFERENCES email_providers(id),
    template_id INTEGER REFERENCES email_templates(id),
    
    -- Recipient Info
    to_email VARCHAR(255) NOT NULL,
    to_name VARCHAR(255),
    from_email VARCHAR(255),
    from_name VARCHAR(255),
    
    -- Email Content
    subject VARCHAR(255) NOT NULL,
    html_content TEXT,
    text_content TEXT,
    
    -- Template Data
    template_data JSONB DEFAULT '{}',
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'sending', 'sent', 'failed', 'cancelled'
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    
    -- Scheduling
    scheduled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sent_at TIMESTAMP,
    
    -- Error Handling
    error_message TEXT,
    last_attempt_at TIMESTAMP,
    
    -- Tracking
    opened_at TIMESTAMP,
    clicked_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Email Analytics
CREATE TABLE IF NOT EXISTS email_analytics (
    id SERIAL PRIMARY KEY,
    provider_id INTEGER REFERENCES email_providers(id),
    template_id INTEGER REFERENCES email_templates(id),
    
    -- Metrics
    date DATE NOT NULL,
    emails_sent INTEGER DEFAULT 0,
    emails_delivered INTEGER DEFAULT 0,
    emails_opened INTEGER DEFAULT 0,
    emails_clicked INTEGER DEFAULT 0,
    emails_bounced INTEGER DEFAULT 0,
    emails_failed INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(provider_id, template_id, date)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_email_providers_active ON email_providers(is_active, is_primary);
CREATE INDEX IF NOT EXISTS idx_email_providers_priority ON email_providers(priority) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_email_templates_type ON email_templates(type, is_active);
CREATE INDEX IF NOT EXISTS idx_email_queue_status ON email_queue(status, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_email_queue_provider ON email_queue(provider_id, status);
CREATE INDEX IF NOT EXISTS idx_email_analytics_date ON email_analytics(date DESC);

-- Insert default email providers
INSERT INTO email_providers (name, type, provider, config, daily_limit, monthly_limit) VALUES
('Amazon SES', 'api', 'ses', '{"region": "us-east-1", "access_key": "", "secret_key": ""}', 50000, 1000000),
('SendGrid', 'api', 'sendgrid', '{"api_key": ""}', 40000, 1200000),
('Mailgun', 'api', 'mailgun', '{"api_key": "", "domain": ""}', 30000, 900000),
('Resend', 'api', 'resend', '{"api_key": ""}', 20000, 600000),
('Gmail SMTP', 'smtp', 'gmail', '{"host": "smtp.gmail.com", "port": 587, "username": "", "password": ""}', 500, 15000),
('Outlook SMTP', 'smtp', 'outlook', '{"host": "smtp-mail.outlook.com", "port": 587, "username": "", "password": ""}', 300, 9000),
('Custom SMTP', 'smtp', 'custom', '{"host": "", "port": 587, "username": "", "password": "", "secure": false}', 1000, 30000)
ON CONFLICT (name) DO NOTHING;

-- Insert default email templates
INSERT INTO email_templates (name, type, subject, html_content, text_content, variables) VALUES
('Welcome Email', 'signup', 'Welcome to {{platform_name}}!', 
'<h1>Welcome {{user_name}}!</h1><p>Thank you for joining {{platform_name}}. Your account is now active.</p>', 
'Welcome {{user_name}}! Thank you for joining {{platform_name}}. Your account is now active.',
'["user_name", "platform_name", "login_url"]'),

('New Order Notification', 'order', 'New Order #{{order_id}} - {{service_title}}',
'<h2>New Order Received</h2><p>Order ID: {{order_id}}</p><p>Service: {{service_title}}</p><p>Amount: ${{amount}}</p>',
'New Order Received. Order ID: {{order_id}}. Service: {{service_title}}. Amount: ${{amount}}.',
'["order_id", "service_title", "amount", "buyer_name", "order_url"]'),

('Transaction Notification', 'transaction', 'Transaction Confirmation - ${{amount}}',
'<h2>Transaction Completed</h2><p>Amount: ${{amount}}</p><p>Type: {{transaction_type}}</p><p>Balance: ${{new_balance}}</p>',
'Transaction Completed. Amount: ${{amount}}. Type: {{transaction_type}}. Balance: ${{new_balance}}.',
'["amount", "transaction_type", "new_balance", "transaction_id"]'),

('Chat Message Notification', 'chat', 'New message from {{sender_name}}',
'<h2>New Message</h2><p>From: {{sender_name}}</p><p>Message: {{message_preview}}</p>',
'New Message from {{sender_name}}: {{message_preview}}',
'["sender_name", "message_preview", "chat_url"]'),

('General Notification', 'notification', '{{notification_title}}',
'<h2>{{notification_title}}</h2><p>{{notification_message}}</p>',
'{{notification_title}}: {{notification_message}}',
'["notification_title", "notification_message", "action_url"]')
ON CONFLICT (name) DO NOTHING;

-- Functions for email management
CREATE OR REPLACE FUNCTION get_active_email_provider()
RETURNS TABLE(
    provider_id INTEGER,
    provider_name VARCHAR(100),
    provider_type VARCHAR(50),
    provider_config JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT id, name, type, config
    FROM email_providers
    WHERE is_active = true AND status = 'active'
    ORDER BY is_primary DESC, priority ASC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION queue_email(
    p_to_email VARCHAR(255),
    p_template_name VARCHAR(100),
    p_template_data JSONB DEFAULT '{}'
)
RETURNS INTEGER AS $$
DECLARE
    v_template_id INTEGER;
    v_provider_id INTEGER;
    v_subject VARCHAR(255);
    v_html_content TEXT;
    v_text_content TEXT;
    v_queue_id INTEGER;
BEGIN
    -- Get template
    SELECT id, subject, html_content, text_content
    INTO v_template_id, v_subject, v_html_content, v_text_content
    FROM email_templates
    WHERE name = p_template_name AND is_active = true;
    
    IF v_template_id IS NULL THEN
        RAISE EXCEPTION 'Template not found: %', p_template_name;
    END IF;
    
    -- Get active provider
    SELECT provider_id INTO v_provider_id
    FROM get_active_email_provider();
    
    IF v_provider_id IS NULL THEN
        RAISE EXCEPTION 'No active email provider found';
    END IF;
    
    -- Queue email
    INSERT INTO email_queue (
        provider_id, template_id, to_email, subject, 
        html_content, text_content, template_data
    ) VALUES (
        v_provider_id, v_template_id, p_to_email, v_subject,
        v_html_content, v_text_content, p_template_data
    ) RETURNING id INTO v_queue_id;
    
    RETURN v_queue_id;
END;
$$ LANGUAGE plpgsql;

-- Update triggers
CREATE OR REPLACE FUNCTION update_email_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER email_providers_updated_at
    BEFORE UPDATE ON email_providers
    FOR EACH ROW EXECUTE FUNCTION update_email_updated_at();

CREATE TRIGGER email_templates_updated_at
    BEFORE UPDATE ON email_templates
    FOR EACH ROW EXECUTE FUNCTION update_email_updated_at();

CREATE TRIGGER email_queue_updated_at
    BEFORE UPDATE ON email_queue
    FOR EACH ROW EXECUTE FUNCTION update_email_updated_at();
