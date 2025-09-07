package services

import (
	"database/sql"
	"encoding/json"
	"time"

	"github.com/google/uuid"
	"microjob-backend/models"
)

type ReservationService struct {
	db *sql.DB
}

func NewReservationService(db *sql.DB) *ReservationService {
	return &ReservationService{db: db}
}

type ReservationSettings struct {
	IsEnabled                 bool `json:"isEnabled"`
	DefaultReservationMinutes int  `json:"defaultReservationMinutes"`
	MaxReservationsPerUser    int  `json:"maxReservationsPerUser"`
	RequirePayment           bool `json:"requirePayment"`
}

func (rs *ReservationService) GetReservationSettings() (*ReservationSettings, error) {
	query := `SELECT setting_value FROM admin_settings WHERE setting_key = 'reservation_settings'`
	
	var settingsJSON string
	err := rs.db.QueryRow(query).Scan(&settingsJSON)
	
	if err == sql.ErrNoRows {
		// Return default settings
		return &ReservationSettings{
			IsEnabled:                 true,
			DefaultReservationMinutes: 30,
			MaxReservationsPerUser:    5,
			RequirePayment:           true,
		}, nil
	}
	
	if err != nil {
		return nil, err
	}
	
	var settings ReservationSettings
	err = json.Unmarshal([]byte(settingsJSON), &settings)
	return &settings, err
}

func (rs *ReservationService) CreateReservation(jobID, userID string, reservationMinutes int) (*models.JobReservation, error) {
	// Check if user already has a reservation for this job
	existingQuery := `
		SELECT id FROM job_reservations 
		WHERE job_id = $1 AND user_id = $2 AND status = 'active' AND expires_at > NOW()`
	
	var existingID string
	err := rs.db.QueryRow(existingQuery, jobID, userID).Scan(&existingID)
	if err == nil {
		// User already has an active reservation
		return nil, fmt.Errorf("user already has an active reservation for this job")
	}

	// Check reservation limits
	settings, err := rs.GetReservationSettings()
	if err != nil {
		return nil, err
	}

	activeReservationsQuery := `
		SELECT COUNT(*) FROM job_reservations 
		WHERE user_id = $1 AND status = 'active' AND expires_at > NOW()`
	
	var activeCount int
	err = rs.db.QueryRow(activeReservationsQuery, userID).Scan(&activeCount)
	if err != nil {
		return nil, err
	}

	if activeCount >= settings.MaxReservationsPerUser {
		return nil, fmt.Errorf("maximum reservations limit reached")
	}

	// Create new reservation
	reservation := &models.JobReservation{
		ID:        uuid.New().String(),
		JobID:     jobID,
		UserID:    userID,
		Status:    "active",
		ExpiresAt: time.Now().Add(time.Duration(reservationMinutes) * time.Minute),
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	query := `
		INSERT INTO job_reservations (id, job_id, user_id, status, expires_at, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7)`
	
	_, err = rs.db.Exec(query, reservation.ID, reservation.JobID, reservation.UserID,
		reservation.Status, reservation.ExpiresAt, reservation.CreatedAt, reservation.UpdatedAt)
	
	return reservation, err
}

func (rs *ReservationService) GetUserReservations(userID string) ([]models.JobReservation, error) {
	query := `
		SELECT jr.id, jr.job_id, jr.user_id, jr.status, jr.expires_at, jr.created_at, jr.updated_at,
			   j.title, j.budget_min, j.budget_max
		FROM job_reservations jr
		LEFT JOIN jobs j ON jr.job_id = j.id
		WHERE jr.user_id = $1 AND jr.status = 'active' AND jr.expires_at > NOW()
		ORDER BY jr.created_at DESC`
	
	rows, err := rs.db.Query(query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var reservations []models.JobReservation
	for rows.Next() {
		var reservation models.JobReservation
		var job models.Job
		
		err := rows.Scan(&reservation.ID, &reservation.JobID, &reservation.UserID,
			&reservation.Status, &reservation.ExpiresAt, &reservation.CreatedAt, &reservation.UpdatedAt,
			&job.Title, &job.BudgetMin, &job.BudgetMax)
		if err != nil {
			return nil, err
		}
		
		reservation.Job = &job
		reservations = append(reservations, reservation)
	}

	return reservations, nil
}

func (rs *ReservationService) CancelReservation(reservationID, userID string) error {
	query := `
		UPDATE job_reservations 
		SET status = 'cancelled', updated_at = $1
		WHERE id = $2 AND user_id = $3 AND status = 'active'`
	
	result, err := rs.db.Exec(query, time.Now(), reservationID, userID)
	if err != nil {
		return err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rowsAffected == 0 {
		return fmt.Errorf("reservation not found or already cancelled")
	}

	return nil
}

func (rs *ReservationService) CleanupExpiredReservations() (int, error) {
	query := `
		UPDATE job_reservations 
		SET status = 'expired', updated_at = $1
		WHERE status = 'active' AND expires_at <= $1`
	
	result, err := rs.db.Exec(query, time.Now())
	if err != nil {
		return 0, err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return 0, err
	}

	return int(rowsAffected), nil
}
