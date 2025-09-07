package models

import (
	"time"
)

type Notification struct {
	ID            string    `json:"id" db:"id"`
	UserID        string    `json:"user_id" db:"user_id"`
	Title         string    `json:"title" db:"title"`
	Message       string    `json:"message" db:"message"`
	Type          string    `json:"type" db:"type"` // "job_application", "order_update", "payment", "review", etc.
	ReferenceID   *string   `json:"reference_id" db:"reference_id"`
	ReferenceType *string   `json:"reference_type" db:"reference_type"`
	IsRead        bool      `json:"is_read" db:"is_read"`
	CreatedAt     time.Time `json:"created_at" db:"created_at"`
}

type Review struct {
	ID         string    `json:"id" db:"id"`
	ReviewerID string    `json:"reviewer_id" db:"reviewer_id"`
	RevieweeID string    `json:"reviewee_id" db:"reviewee_id"`
	OrderID    *string   `json:"order_id" db:"order_id"`
	JobID      *string   `json:"job_id" db:"job_id"`
	Rating     int       `json:"rating" db:"rating"` // 1-5
	Comment    *string   `json:"comment" db:"comment"`
	CreatedAt  time.Time `json:"created_at" db:"created_at"`
}
