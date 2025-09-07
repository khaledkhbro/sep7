package models

import (
	"time"
)

type Chat struct {
	ID                 string     `json:"id" db:"id"`
	Type               string     `json:"type" db:"type"` // "direct", "order", "admin_support"
	Title              *string    `json:"title" db:"title"`
	OrderID            *string    `json:"order_id" db:"order_id"`
	JobID              *string    `json:"job_id" db:"job_id"`
	MarketplaceItemID  *string    `json:"marketplace_item_id" db:"marketplace_item_id"`
	CreatedBy          string     `json:"created_by" db:"created_by"`
	IsActive           bool       `json:"is_active" db:"is_active"`
	LastMessageAt      time.Time  `json:"last_message_at" db:"last_message_at"`
	CreatedAt          time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt          time.Time  `json:"updated_at" db:"updated_at"`
}

type ChatParticipant struct {
	ID       string     `json:"id" db:"id"`
	ChatID   string     `json:"chat_id" db:"chat_id"`
	UserID   string     `json:"user_id" db:"user_id"`
	Role     string     `json:"role" db:"role"` // "participant", "admin", "moderator"
	JoinedAt time.Time  `json:"joined_at" db:"joined_at"`
	LeftAt   *time.Time `json:"left_at" db:"left_at"`
	IsActive bool       `json:"is_active" db:"is_active"`
}

type Message struct {
	ID          string     `json:"id" db:"id"`
	ChatID      string     `json:"chat_id" db:"chat_id"`
	SenderID    string     `json:"sender_id" db:"sender_id"`
	MessageType string     `json:"message_type" db:"message_type"` // "text", "image", "file", "system"
	Content     string     `json:"content" db:"content"`
	FileURL     *string    `json:"file_url" db:"file_url"`
	FileName    *string    `json:"file_name" db:"file_name"`
	FileSize    *int       `json:"file_size" db:"file_size"`
	ReplyToID   *string    `json:"reply_to_id" db:"reply_to_id"`
	IsEdited    bool       `json:"is_edited" db:"is_edited"`
	EditedAt    *time.Time `json:"edited_at" db:"edited_at"`
	CreatedAt   time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at" db:"updated_at"`
}

type MessageStatus struct {
	ID        string     `json:"id" db:"id"`
	MessageID string     `json:"message_id" db:"message_id"`
	UserID    string     `json:"user_id" db:"user_id"`
	Status    string     `json:"status" db:"status"` // "sent", "delivered", "read"
	ReadAt    *time.Time `json:"read_at" db:"read_at"`
	CreatedAt time.Time  `json:"created_at" db:"created_at"`
}

type ChatSettings struct {
	ID                   string     `json:"id" db:"id"`
	UserID               string     `json:"user_id" db:"user_id"`
	ChatID               string     `json:"chat_id" db:"chat_id"`
	NotificationsEnabled bool       `json:"notifications_enabled" db:"notifications_enabled"`
	MutedUntil           *time.Time `json:"muted_until" db:"muted_until"`
	CustomName           *string    `json:"custom_name" db:"custom_name"`
	CreatedAt            time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt            time.Time  `json:"updated_at" db:"updated_at"`
}
