package services

import (
	"crypto/rand"
	"database/sql"
	"encoding/hex"
	"strings"
	"time"

	"github.com/google/uuid"
	"microjob-backend/models"
)

type ReferralService struct {
	db *sql.DB
}

func NewReferralService(db *sql.DB) *ReferralService {
	return &ReferralService{db: db}
}

type ReferralData struct {
	ReferralCode string                 `json:"referralCode"`
	Statistics   ReferralStatistics     `json:"statistics"`
	Referrals    []ReferralInfo         `json:"referrals"`
}

type ReferralStatistics struct {
	Total     int `json:"total"`
	Completed int `json:"completed"`
	Pending   int `json:"pending"`
	VIP       int `json:"vip"`
}

type ReferralInfo struct {
	ID          string `json:"id"`
	UserID      string `json:"userId"`
	FullName    string `json:"fullName"`
	Email       string `json:"email"`
	Country     string `json:"country"`
	JoiningDate string `json:"joiningDate"`
	Status      string `json:"status"`
	Type        string `json:"type"`
}

func (rs *ReferralService) GetUserReferrals(userID string) (*ReferralData, error) {
	// Get user's referral code
	referralCode, err := rs.getUserReferralCode(userID)
	if err != nil {
		return nil, err
	}

	// Get referred users
	query := `
		SELECT r.id, r.status, r.created_at,
			   u.id, u.first_name, u.last_name, u.email, u.created_at, u.location
		FROM referrals r
		LEFT JOIN users u ON r.referred_id = u.id
		WHERE r.referrer_id = $1
		ORDER BY r.created_at DESC`
	
	rows, err := rs.db.Query(query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var referrals []ReferralInfo
	totalReferrals := 0
	completedReferrals := 0
	pendingReferrals := 0

	for rows.Next() {
		var referral models.Referral
		var user models.User
		var location sql.NullString
		
		err := rows.Scan(&referral.ID, &referral.Status, &referral.CreatedAt,
			&user.ID, &user.FirstName, &user.LastName, &user.Email, &user.CreatedAt, &location)
		if err != nil {
			return nil, err
		}

		country := "Not specified"
		if location.Valid {
			country = location.String
		}

		referralType := "Regular"
		if referral.Status == "completed" {
			referralType = "VIP"
			completedReferrals++
		} else {
			pendingReferrals++
		}

		referrals = append(referrals, ReferralInfo{
			ID:          referral.ID,
			UserID:      user.ID,
			FullName:    user.FirstName + " " + user.LastName,
			Email:       user.Email,
			Country:     country,
			JoiningDate: user.CreatedAt.Format(time.RFC3339),
			Status:      referral.Status,
			Type:        referralType,
		})

		totalReferrals++
	}

	return &ReferralData{
		ReferralCode: referralCode,
		Statistics: ReferralStatistics{
			Total:     totalReferrals,
			Completed: completedReferrals,
			Pending:   pendingReferrals,
			VIP:       completedReferrals,
		},
		Referrals: referrals,
	}, nil
}

func (rs *ReferralService) getUserReferralCode(userID string) (string, error) {
	var code string
	query := `SELECT code FROM referral_codes WHERE user_id = $1`
	err := rs.db.QueryRow(query, userID).Scan(&code)
	
	if err == sql.ErrNoRows {
		// Generate new code if doesn't exist
		return rs.GenerateReferralCode(userID)
	}
	
	return code, err
}

func (rs *ReferralService) GenerateReferralCode(userID string) (string, error) {
	// Generate a random 8-character code
	bytes := make([]byte, 4)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	
	code := strings.ToUpper(hex.EncodeToString(bytes))
	
	// Check if code already exists
	var exists bool
	checkQuery := `SELECT EXISTS(SELECT 1 FROM referral_codes WHERE code = $1)`
	err := rs.db.QueryRow(checkQuery, code).Scan(&exists)
	if err != nil {
		return "", err
	}
	
	if exists {
		// Recursively generate new code if collision
		return rs.GenerateReferralCode(userID)
	}
	
	// Insert or update referral code
	upsertQuery := `
		INSERT INTO referral_codes (user_id, code, created_at, updated_at)
		VALUES ($1, $2, $3, $4)
		ON CONFLICT (user_id)
		DO UPDATE SET code = $2, updated_at = $4`
	
	now := time.Now()
	_, err = rs.db.Exec(upsertQuery, userID, code, now, now)
	
	return code, err
}

func (rs *ReferralService) CreateReferral(referrerID, referredID, code string) error {
	referral := &models.Referral{
		ID:         uuid.New().String(),
		ReferrerID: referrerID,
		ReferredID: referredID,
		Code:       code,
		Status:     "pending",
		CreatedAt:  time.Now(),
		UpdatedAt:  time.Now(),
	}

	query := `
		INSERT INTO referrals (id, referrer_id, referred_id, code, status, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7)`
	
	_, err := rs.db.Exec(query, referral.ID, referral.ReferrerID, referral.ReferredID,
		referral.Code, referral.Status, referral.CreatedAt, referral.UpdatedAt)
	
	return err
}
