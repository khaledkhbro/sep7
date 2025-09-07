package models

import (
	"database/sql/driver"
	"encoding/json"
	"time"
)

type User struct {
	ID           string    `json:"id" db:"id"`
	Email        string    `json:"email" db:"email"`
	PasswordHash string    `json:"-" db:"password_hash"`
	FirstName    string    `json:"first_name" db:"first_name"`
	LastName     string    `json:"last_name" db:"last_name"`
	Username     string    `json:"username" db:"username"`
	Phone        *string   `json:"phone" db:"phone"`
	AvatarURL    *string   `json:"avatar_url" db:"avatar_url"`
	Bio          *string   `json:"bio" db:"bio"`
	Location     *string   `json:"location" db:"location"`
	Skills       JSONArray `json:"skills" db:"skills"`
	Rating       float64   `json:"rating" db:"rating"`
	TotalReviews int       `json:"total_reviews" db:"total_reviews"`
	IsVerified   bool      `json:"is_verified" db:"is_verified"`
	IsActive     bool      `json:"is_active" db:"is_active"`
	UserType     string    `json:"user_type" db:"user_type"` // "user", "admin"
	CreatedAt    time.Time `json:"created_at" db:"created_at"`
	UpdatedAt    time.Time `json:"updated_at" db:"updated_at"`
}

type JSONArray []string

func (j JSONArray) Value() (driver.Value, error) {
	if len(j) == 0 {
		return "{}", nil
	}
	return json.Marshal(j)
}

func (j *JSONArray) Scan(value interface{}) error {
	if value == nil {
		*j = JSONArray{}
		return nil
	}
	
	bytes, ok := value.([]byte)
	if !ok {
		return nil
	}
	
	return json.Unmarshal(bytes, j)
}

type AuthUser struct {
	ID       string `json:"id"`
	Email    string `json:"email"`
	UserType string `json:"userType"`
}

type LoginRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required,min=6"`
}

type RegisterRequest struct {
	Email     string `json:"email" validate:"required,email"`
	Password  string `json:"password" validate:"required,min=6"`
	FirstName string `json:"firstName" validate:"required"`
	LastName  string `json:"lastName" validate:"required"`
	UserType  string `json:"userType" validate:"required,oneof=user admin"`
}

type ReferralCode struct {
	ID        string    `json:"id" db:"id"`
	UserID    string    `json:"user_id" db:"user_id"`
	Code      string    `json:"code" db:"code"`
	UsesCount int       `json:"uses_count" db:"uses_count"`
	MaxUses   int       `json:"max_uses" db:"max_uses"`
	IsActive  bool      `json:"is_active" db:"is_active"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
}

type Referral struct {
	ID           string    `json:"id" db:"id"`
	ReferrerID   string    `json:"referrer_id" db:"referrer_id"`
	ReferredID   string    `json:"referred_id" db:"referred_id"`
	ReferralCode string    `json:"referral_code" db:"referral_code"`
	Status       string    `json:"status" db:"status"` // "pending", "completed"
	RewardAmount float64   `json:"reward_amount" db:"reward_amount"`
	CreatedAt    time.Time `json:"created_at" db:"created_at"`
}
