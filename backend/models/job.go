package models

import (
	"time"
)

type Category struct {
	ID          string     `json:"id" db:"id"`
	Name        string     `json:"name" db:"name"`
	Slug        string     `json:"slug" db:"slug"`
	Description *string    `json:"description" db:"description"`
	Icon        *string    `json:"icon" db:"icon"`
	ParentID    *string    `json:"parent_id" db:"parent_id"`
	IsActive    bool       `json:"is_active" db:"is_active"`
	CreatedAt   time.Time  `json:"created_at" db:"created_at"`
}

type Microjob struct {
	ID                 string    `json:"id" db:"id"`
	UserID             string    `json:"user_id" db:"user_id"`
	CategoryID         string    `json:"category_id" db:"category_id"`
	Title              string    `json:"title" db:"title"`
	Description        string    `json:"description" db:"description"`
	Requirements       *string   `json:"requirements" db:"requirements"`
	BudgetMin          *float64  `json:"budget_min" db:"budget_min"`
	BudgetMax          *float64  `json:"budget_max" db:"budget_max"`
	Deadline           *string   `json:"deadline" db:"deadline"` // DATE type
	Location           *string   `json:"location" db:"location"`
	IsRemote           bool      `json:"is_remote" db:"is_remote"`
	Status             string    `json:"status" db:"status"` // "open", "in_progress", "completed", "cancelled"
	Priority           string    `json:"priority" db:"priority"` // "low", "normal", "high", "urgent"
	Attachments        JSONArray `json:"attachments" db:"attachments"`
	SkillsRequired     JSONArray `json:"skills_required" db:"skills_required"`
	ApplicationsCount  int       `json:"applications_count" db:"applications_count"`
	ViewsCount         int       `json:"views_count" db:"views_count"`
	CreatedAt          time.Time `json:"created_at" db:"created_at"`
	UpdatedAt          time.Time `json:"updated_at" db:"updated_at"`
}

type JobApplication struct {
	ID                string     `json:"id" db:"id"`
	JobID             string     `json:"job_id" db:"job_id"`
	ApplicantID       string     `json:"applicant_id" db:"applicant_id"`
	CoverLetter       *string    `json:"cover_letter" db:"cover_letter"`
	ProposedBudget    *float64   `json:"proposed_budget" db:"proposed_budget"`
	EstimatedDuration *string    `json:"estimated_duration" db:"estimated_duration"`
	PortfolioLinks    JSONArray  `json:"portfolio_links" db:"portfolio_links"`
	Status            string     `json:"status" db:"status"` // "pending", "accepted", "rejected"
	CreatedAt         time.Time  `json:"created_at" db:"created_at"`
}

type WorkProof struct {
	ID            string     `json:"id" db:"id"`
	JobID         string     `json:"job_id" db:"job_id"`
	WorkerID      string     `json:"worker_id" db:"worker_id"`
	ApplicationID string     `json:"application_id" db:"application_id"`
	Title         string     `json:"title" db:"title"`
	Description   string     `json:"description" db:"description"`
	Status        string     `json:"status" db:"status"` // "pending", "approved", "rejected", "revision_requested"
	PaymentAmount float64    `json:"payment_amount" db:"payment_amount"`
	ReviewNotes   *string    `json:"review_notes" db:"review_notes"`
	CreatedAt     time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt     time.Time  `json:"updated_at" db:"updated_at"`
	ApprovedAt    *time.Time `json:"approved_at" db:"approved_at"`
	RejectedAt    *time.Time `json:"rejected_at" db:"rejected_at"`
}

type JobReservation struct {
	ID        string    `json:"id" db:"id"`
	JobID     string    `json:"job_id" db:"job_id"`
	UserID    string    `json:"user_id" db:"user_id"`
	Status    string    `json:"status" db:"status"` // "active", "expired", "cancelled"
	ExpiresAt time.Time `json:"expires_at" db:"expires_at"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
	UpdatedAt time.Time `json:"updated_at" db:"updated_at"`
}

type UserFavorite struct {
	ID        string    `json:"id" db:"id"`
	UserID    string    `json:"user_id" db:"user_id"`
	JobID     string    `json:"job_id" db:"job_id"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
}
