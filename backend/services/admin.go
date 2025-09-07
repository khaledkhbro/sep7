package services

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"time"

	"github.com/google/uuid"
	"microjob-backend/models"
)

type AdminService struct {
	db *sql.DB
}

func NewAdminService(db *sql.DB) *AdminService {
	return &AdminService{db: db}
}

// Platform Fee Settings
func (as *AdminService) GetPlatformFeeSettings() (*models.PlatformFeeSettings, error) {
	query := `
		SELECT id, enabled, percentage, fixed_fee, minimum_fee, maximum_fee, created_at, updated_at
		FROM platform_fee_settings 
		WHERE id = 'default'`
	
	var settings models.PlatformFeeSettings
	err := as.db.QueryRow(query).Scan(
		&settings.ID, &settings.Enabled, &settings.Percentage, &settings.FixedFee,
		&settings.MinimumFee, &settings.MaximumFee, &settings.CreatedAt, &settings.UpdatedAt,
	)
	
	if err == sql.ErrNoRows {
		// Create default settings
		return as.createDefaultPlatformFeeSettings()
	}
	
	return &settings, err
}

func (as *AdminService) createDefaultPlatformFeeSettings() (*models.PlatformFeeSettings, error) {
	settings := &models.PlatformFeeSettings{
		ID:         "default",
		Enabled:    true,
		Percentage: 5.0,
		FixedFee:   0.0,
		MinimumFee: 0.0,
		MaximumFee: 0,
		CreatedAt:  time.Now(),
		UpdatedAt:  time.Now(),
	}
	
	query := `
		INSERT INTO platform_fee_settings (id, enabled, percentage, fixed_fee, minimum_fee, maximum_fee, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`
	
	_, err := as.db.Exec(query, settings.ID, settings.Enabled, settings.Percentage,
		settings.FixedFee, settings.MinimumFee, settings.MaximumFee, settings.CreatedAt, settings.UpdatedAt)
	
	return settings, err
}

func (as *AdminService) UpdatePlatformFeeSettings(updateData *models.PlatformFeeSettings) (*models.PlatformFeeSettings, error) {
	updateData.UpdatedAt = time.Now()
	
	query := `
		UPDATE platform_fee_settings 
		SET enabled = $1, percentage = $2, fixed_fee = $3, minimum_fee = $4, maximum_fee = $5, updated_at = $6
		WHERE id = 'default'`
	
	_, err := as.db.Exec(query, updateData.Enabled, updateData.Percentage, updateData.FixedFee,
		updateData.MinimumFee, updateData.MaximumFee, updateData.UpdatedAt)
	
	if err != nil {
		return nil, err
	}
	
	return as.GetPlatformFeeSettings()
}

// Revision Settings (stored as JSON in admin_settings table)
func (as *AdminService) GetRevisionSettings() (map[string]interface{}, error) {
	query := `SELECT setting_value FROM admin_settings WHERE setting_key = 'revision_settings'`
	
	var settingsJSON string
	err := as.db.QueryRow(query).Scan(&settingsJSON)
	
	if err == sql.ErrNoRows {
		// Return default settings
		defaultSettings := map[string]interface{}{
			"maxRevisionRequests":         2,
			"revisionRequestTimeoutValue": 24,
			"revisionRequestTimeoutUnit":  "hours",
			"rejectionResponseTimeoutValue": 24,
			"rejectionResponseTimeoutUnit":  "hours",
			"enableAutomaticRefunds":      true,
			"refundOnRevisionTimeout":     true,
			"refundOnRejectionTimeout":    true,
			"enableRevisionWarnings":      true,
			"revisionPenaltyEnabled":      false,
			"revisionPenaltyAmount":       0,
		}
		return defaultSettings, nil
	}
	
	if err != nil {
		return nil, err
	}
	
	var settings map[string]interface{}
	err = json.Unmarshal([]byte(settingsJSON), &settings)
	return settings, err
}

func (as *AdminService) UpdateRevisionSettings(settings map[string]interface{}) error {
	settingsJSON, err := json.Marshal(settings)
	if err != nil {
		return err
	}
	
	query := `
		INSERT INTO admin_settings (setting_key, setting_value, updated_at)
		VALUES ('revision_settings', $1, $2)
		ON CONFLICT (setting_key) 
		DO UPDATE SET setting_value = $1, updated_at = $2`
	
	_, err = as.db.Exec(query, string(settingsJSON), time.Now())
	return err
}

// Fee Settings
func (as *AdminService) GetAllFeeSettings() ([]models.AdminFeeSetting, error) {
	query := `
		SELECT fee_type, fee_percentage, fee_fixed, minimum_fee, maximum_fee, is_active, created_at, updated_at
		FROM admin_fee_settings 
		ORDER BY fee_type`
	
	rows, err := as.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var feeSettings []models.AdminFeeSetting
	for rows.Next() {
		var setting models.AdminFeeSetting
		err := rows.Scan(&setting.FeeType, &setting.FeePercentage, &setting.FeeFixed,
			&setting.MinimumFee, &setting.MaximumFee, &setting.IsActive,
			&setting.CreatedAt, &setting.UpdatedAt)
		if err != nil {
			return nil, err
		}
		feeSettings = append(feeSettings, setting)
	}

	return feeSettings, nil
}

func (as *AdminService) UpsertFeeSetting(feeSetting *models.AdminFeeSetting) (*models.AdminFeeSetting, error) {
	feeSetting.UpdatedAt = time.Now()
	
	query := `
		INSERT INTO admin_fee_settings (fee_type, fee_percentage, fee_fixed, minimum_fee, maximum_fee, is_active, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		ON CONFLICT (fee_type)
		DO UPDATE SET 
			fee_percentage = $2, fee_fixed = $3, minimum_fee = $4, maximum_fee = $5, 
			is_active = $6, updated_at = $8
		RETURNING fee_type, fee_percentage, fee_fixed, minimum_fee, maximum_fee, is_active, created_at, updated_at`
	
	var result models.AdminFeeSetting
	err := as.db.QueryRow(query, feeSetting.FeeType, feeSetting.FeePercentage, feeSetting.FeeFixed,
		feeSetting.MinimumFee, feeSetting.MaximumFee, feeSetting.IsActive, time.Now(), feeSetting.UpdatedAt).Scan(
		&result.FeeType, &result.FeePercentage, &result.FeeFixed, &result.MinimumFee,
		&result.MaximumFee, &result.IsActive, &result.CreatedAt, &result.UpdatedAt)
	
	return &result, err
}

// Generic settings methods for other admin settings
func (as *AdminService) GetApprovalSettings() (map[string]interface{}, error) {
	return as.getSettingsByKey("approval_settings")
}

func (as *AdminService) UpdateApprovalSettings(settings map[string]interface{}) error {
	return as.updateSettingsByKey("approval_settings", settings)
}

func (as *AdminService) GetFeatureSettings() (map[string]interface{}, error) {
	return as.getSettingsByKey("feature_settings")
}

func (as *AdminService) UpdateFeatureSettings(settings map[string]interface{}) error {
	return as.updateSettingsByKey("feature_settings", settings)
}

func (as *AdminService) GetReservationSettings() (map[string]interface{}, error) {
	return as.getSettingsByKey("reservation_settings")
}

func (as *AdminService) UpdateReservationSettings(settings map[string]interface{}) error {
	return as.updateSettingsByKey("reservation_settings", settings)
}

// Helper methods
func (as *AdminService) getSettingsByKey(key string) (map[string]interface{}, error) {
	query := `SELECT setting_value FROM admin_settings WHERE setting_key = $1`
	
	var settingsJSON string
	err := as.db.QueryRow(query, key).Scan(&settingsJSON)
	
	if err == sql.ErrNoRows {
		return make(map[string]interface{}), nil
	}
	
	if err != nil {
		return nil, err
	}
	
	var settings map[string]interface{}
	err = json.Unmarshal([]byte(settingsJSON), &settings)
	return settings, err
}

func (as *AdminService) updateSettingsByKey(key string, settings map[string]interface{}) error {
	settingsJSON, err := json.Marshal(settings)
	if err != nil {
		return err
	}
	
	query := `
		INSERT INTO admin_settings (setting_key, setting_value, updated_at)
		VALUES ($1, $2, $3)
		ON CONFLICT (setting_key) 
		DO UPDATE SET setting_value = $2, updated_at = $3`
	
	_, err = as.db.Exec(query, key, string(settingsJSON), time.Now())
	return err
}

// Support Pricing
func (as *AdminService) GetSupportPricing() ([]models.SupportPricing, error) {
	query := `
		SELECT id, service_type, price, description, is_active, created_at, updated_at
		FROM support_pricing 
		ORDER BY service_type`
	
	rows, err := as.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var pricing []models.SupportPricing
	for rows.Next() {
		var item models.SupportPricing
		err := rows.Scan(&item.ID, &item.ServiceType, &item.Price, &item.Description,
			&item.IsActive, &item.CreatedAt, &item.UpdatedAt)
		if err != nil {
			return nil, err
		}
		pricing = append(pricing, item)
	}

	return pricing, nil
}

func (as *AdminService) UpdateSupportPricing(pricing []models.SupportPricing) error {
	tx, err := as.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	// Clear existing pricing
	_, err = tx.Exec("DELETE FROM support_pricing")
	if err != nil {
		return err
	}

	// Insert new pricing
	query := `
		INSERT INTO support_pricing (id, service_type, price, description, is_active, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7)`

	for _, item := range pricing {
		if item.ID == "" {
			item.ID = uuid.New().String()
		}
		item.CreatedAt = time.Now()
		item.UpdatedAt = time.Now()

		_, err = tx.Exec(query, item.ID, item.ServiceType, item.Price, item.Description,
			item.IsActive, item.CreatedAt, item.UpdatedAt)
		if err != nil {
			return err
		}
	}

	return tx.Commit()
}

// Reservation Violations
func (as *AdminService) GetReservationViolations(limit, offset int) ([]models.ReservationViolation, int, error) {
	// Get total count
	var total int
	countQuery := `SELECT COUNT(*) FROM reservation_violations`
	err := as.db.QueryRow(countQuery).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	// Get violations with pagination
	query := `
		SELECT rv.id, rv.user_id, rv.job_id, rv.violation_type, rv.description, rv.penalty_amount,
			   rv.status, rv.created_at, rv.updated_at,
			   u.first_name, u.last_name, u.username,
			   j.title
		FROM reservation_violations rv
		LEFT JOIN users u ON rv.user_id = u.id
		LEFT JOIN jobs j ON rv.job_id = j.id
		ORDER BY rv.created_at DESC
		LIMIT $1 OFFSET $2`
	
	rows, err := as.db.Query(query, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var violations []models.ReservationViolation
	for rows.Next() {
		var violation models.ReservationViolation
		var user models.User
		var jobTitle sql.NullString
		
		err := rows.Scan(&violation.ID, &violation.UserID, &violation.JobID, &violation.ViolationType,
			&violation.Description, &violation.PenaltyAmount, &violation.Status,
			&violation.CreatedAt, &violation.UpdatedAt,
			&user.FirstName, &user.LastName, &user.Username, &jobTitle)
		if err != nil {
			return nil, 0, err
		}

		violation.User = &user
		if jobTitle.Valid {
			violation.JobTitle = jobTitle.String
		}
		
		violations = append(violations, violation)
	}

	return violations, total, nil
}
