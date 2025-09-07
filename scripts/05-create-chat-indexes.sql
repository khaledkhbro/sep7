-- Chat System Indexes for Performance Optimization

-- Chats table indexes
CREATE INDEX idx_chats_type ON chats(type);
CREATE INDEX idx_chats_created_by ON chats(created_by);
CREATE INDEX idx_chats_order_id ON chats(order_id);
CREATE INDEX idx_chats_job_id ON chats(job_id);
CREATE INDEX idx_chats_marketplace_item_id ON chats(marketplace_item_id);
CREATE INDEX idx_chats_last_message_at ON chats(last_message_at DESC);
CREATE INDEX idx_chats_active ON chats(is_active);

-- Chat participants indexes
CREATE INDEX idx_chat_participants_chat_id ON chat_participants(chat_id);
CREATE INDEX idx_chat_participants_user_id ON chat_participants(user_id);
CREATE INDEX idx_chat_participants_active ON chat_participants(is_active);
CREATE INDEX idx_chat_participants_role ON chat_participants(role);

-- Messages table indexes
CREATE INDEX idx_messages_chat_id ON messages(chat_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX idx_messages_type ON messages(message_type);
CREATE INDEX idx_messages_reply_to ON messages(reply_to_id);

-- Message status indexes
CREATE INDEX idx_message_status_message_id ON message_status(message_id);
CREATE INDEX idx_message_status_user_id ON message_status(user_id);
CREATE INDEX idx_message_status_status ON message_status(status);
CREATE INDEX idx_message_status_unread ON message_status(user_id, status) WHERE status != 'read';

-- Chat settings indexes
CREATE INDEX idx_chat_settings_user_id ON chat_settings(user_id);
CREATE INDEX idx_chat_settings_chat_id ON chat_settings(chat_id);

-- Composite indexes for common queries
CREATE INDEX idx_chats_user_active ON chats(created_by, is_active, last_message_at DESC);
CREATE INDEX idx_messages_chat_time ON messages(chat_id, created_at DESC);
CREATE INDEX idx_participants_user_active ON chat_participants(user_id, is_active);
