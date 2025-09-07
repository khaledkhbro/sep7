package models

import (
	"time"
)

type Wallet struct {
	ID             string    `json:"id" db:"id"`
	UserID         string    `json:"user_id" db:"user_id"`
	Balance        float64   `json:"balance" db:"balance"`
	PendingBalance float64   `json:"pending_balance" db:"pending_balance"`
	TotalEarned    float64   `json:"total_earned" db:"total_earned"`
	TotalSpent     float64   `json:"total_spent" db:"total_spent"`
	CreatedAt      time.Time `json:"created_at" db:"created_at"`
	UpdatedAt      time.Time `json:"updated_at" db:"updated_at"`
}

type WalletTransaction struct {
	ID            string    `json:"id" db:"id"`
	WalletID      string    `json:"wallet_id" db:"wallet_id"`
	Type          string    `json:"type" db:"type"` // "deposit", "withdrawal", "payment", "earning", "refund"
	Amount        float64   `json:"amount" db:"amount"`
	Description   *string   `json:"description" db:"description"`
	ReferenceID   *string   `json:"reference_id" db:"reference_id"`
	ReferenceType *string   `json:"reference_type" db:"reference_type"`
	Status        string    `json:"status" db:"status"` // "pending", "completed", "failed"
	CreatedAt     time.Time `json:"created_at" db:"created_at"`
}

type ChatMoneyTransfer struct {
	ID               string     `json:"id" db:"id"`
	ChatID           string     `json:"chat_id" db:"chat_id"`
	SenderID         string     `json:"sender_id" db:"sender_id"`
	ReceiverID       string     `json:"receiver_id" db:"receiver_id"`
	Amount           float64    `json:"amount" db:"amount"`
	CommissionAmount float64    `json:"commission_amount" db:"commission_amount"`
	NetAmount        float64    `json:"net_amount" db:"net_amount"`
	Message          *string    `json:"message" db:"message"`
	Status           string     `json:"status" db:"status"` // "pending", "completed", "failed"
	CreatedAt        time.Time  `json:"created_at" db:"created_at"`
	CompletedAt      *time.Time `json:"completed_at" db:"completed_at"`
}
