package models

import (
	"time"
)

type AdminSettings struct {
	ID        string    `json:"id" db:"id"`
	Key       string    `json:"key" db:"key"`
	Value     string    `json:"value" db:"value"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
	UpdatedAt time.Time `json:"updated_at" db:"updated_at"`
}

type PlatformFeeSettings struct {
	ID         string    `json:"id" db:"id"`
	Enabled    bool      `json:"enabled" db:"enabled"`
	Percentage float64   `json:"percentage" db:"percentage"`
	FixedFee   float64   `json:"fixed_fee" db:"fixed_fee"`
	MinimumFee float64   `json:"minimum_fee" db:"minimum_fee"`
	MaximumFee float64   `json:"maximum_fee" db:"maximum_fee"`
	CreatedAt  time.Time `json:"created_at" db:"created_at"`
	UpdatedAt  time.Time `json:"updated_at" db:"updated_at"`
}

type AdminFeeSettings struct {
	ID            string    `json:"id" db:"id"`
	FeeType       string    `json:"fee_type" db:"fee_type"`
	FeePercentage float64   `json:"fee_percentage" db:"fee_percentage"`
	FeeFixed      float64   `json:"fee_fixed" db:"fee_fixed"`
	MinimumFee    float64   `json:"minimum_fee" db:"minimum_fee"`
	MaximumFee    *float64  `json:"maximum_fee" db:"maximum_fee"`
	IsActive      bool      `json:"is_active" db:"is_active"`
	CreatedAt     time.Time `json:"created_at" db:"created_at"`
	UpdatedAt     time.Time `json:"updated_at" db:"updated_at"`
}

type SupportPricingSettings struct {
	ID                string    `json:"id" db:"id"`
	SupportType       string    `json:"support_type" db:"support_type"`
	Price             float64   `json:"price" db:"price"`
	ResponseTimeHours int       `json:"response_time_hours" db:"response_time_hours"`
	Description       *string   `json:"description" db:"description"`
	IsActive          bool      `json:"is_active" db:"is_active"`
	CreatedAt         time.Time `json:"created_at" db:"created_at"`
	UpdatedAt         time.Time `json:"updated_at" db:"updated_at"`
}

type SupportTicket struct {
	ID                   string     `json:"id" db:"id"`
	UserID               string     `json:"user_id" db:"user_id"`
	ChatID               *string    `json:"chat_id" db:"chat_id"`
	TicketType           string     `json:"ticket_type" db:"ticket_type"`
	Subject              string     `json:"subject" db:"subject"`
	Description          string     `json:"description" db:"description"`
	Priority             string     `json:"priority" db:"priority"`
	Status               string     `json:"status" db:"status"`
	PaymentAmount        float64    `json:"payment_amount" db:"payment_amount"`
	ResponseTimeHours    int        `json:"response_time_hours" db:"response_time_hours"`
	PaymentTransactionID *string    `json:"payment_transaction_id" db:"payment_transaction_id"`
	CreatedAt            time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt            time.Time  `json:"updated_at" db:"updated_at"`
}

type ReservationViolation struct {
	ID                   string    `json:"id" db:"id"`
	UserID               string    `json:"user_id" db:"user_id"`
	ViolationCount       int       `json:"violation_count" db:"violation_count"`
	LastViolationAt      time.Time `json:"last_violation_at" db:"last_violation_at"`
	TotalReservations    int       `json:"total_reservations" db:"total_reservations"`
	ExpiredReservations  int       `json:"expired_reservations" db:"expired_reservations"`
	CreatedAt            time.Time `json:"created_at" db:"created_at"`
	UpdatedAt            time.Time `json:"updated_at" db:"updated_at"`
}
