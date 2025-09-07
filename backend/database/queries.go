package database

import (
	"database/sql"
	"fmt"
	"strings"

	"microjob-backend/models"
)

// User queries
func (db *DB) GetUserByEmail(email string) (*models.User, error) {
	query := `
		SELECT id, email, password_hash, first_name, last_name, username, phone, 
		       avatar_url, bio, location, skills, rating, total_reviews, 
		       is_verified, is_active, user_type, created_at, updated_at
		FROM users WHERE email = $1 AND is_active = true`
	
	var user models.User
	err := db.QueryRow(query, email).Scan(
		&user.ID, &user.Email, &user.PasswordHash, &user.FirstName, &user.LastName,
		&user.Username, &user.Phone, &user.AvatarURL, &user.Bio, &user.Location,
		&user.Skills, &user.Rating, &user.TotalReviews, &user.IsVerified,
		&user.IsActive, &user.UserType, &user.CreatedAt, &user.UpdatedAt,
	)
	
	if err != nil {
		return nil, err
	}
	
	return &user, nil
}

func (db *DB) GetUserByID(id string) (*models.User, error) {
	query := `
		SELECT id, email, password_hash, first_name, last_name, username, phone, 
		       avatar_url, bio, location, skills, rating, total_reviews, 
		       is_verified, is_active, user_type, created_at, updated_at
		FROM users WHERE id = $1 AND is_active = true`
	
	var user models.User
	err := db.QueryRow(query, id).Scan(
		&user.ID, &user.Email, &user.PasswordHash, &user.FirstName, &user.LastName,
		&user.Username, &user.Phone, &user.AvatarURL, &user.Bio, &user.Location,
		&user.Skills, &user.Rating, &user.TotalReviews, &user.IsVerified,
		&user.IsActive, &user.UserType, &user.CreatedAt, &user.UpdatedAt,
	)
	
	if err != nil {
		return nil, err
	}
	
	return &user, nil
}

func (db *DB) CreateUser(user *models.User) error {
	query := `
		INSERT INTO users (id, email, password_hash, first_name, last_name, username, user_type)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING created_at, updated_at`
	
	return db.QueryRow(query, user.ID, user.Email, user.PasswordHash, 
		user.FirstName, user.LastName, user.Username, user.UserType).Scan(
		&user.CreatedAt, &user.UpdatedAt)
}

// Wallet queries
func (db *DB) GetWalletByUserID(userID string) (*models.Wallet, error) {
	query := `
		SELECT id, user_id, balance, pending_balance, total_earned, total_spent, created_at, updated_at
		FROM wallets WHERE user_id = $1`
	
	var wallet models.Wallet
	err := db.QueryRow(query, userID).Scan(
		&wallet.ID, &wallet.UserID, &wallet.Balance, &wallet.PendingBalance,
		&wallet.TotalEarned, &wallet.TotalSpent, &wallet.CreatedAt, &wallet.UpdatedAt,
	)
	
	if err != nil {
		return nil, err
	}
	
	return &wallet, nil
}

func (db *DB) CreateWallet(wallet *models.Wallet) error {
	query := `
		INSERT INTO wallets (id, user_id, balance, pending_balance, total_earned, total_spent)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING created_at, updated_at`
	
	return db.QueryRow(query, wallet.ID, wallet.UserID, wallet.Balance,
		wallet.PendingBalance, wallet.TotalEarned, wallet.TotalSpent).Scan(
		&wallet.CreatedAt, &wallet.UpdatedAt)
}

func (db *DB) UpdateWalletBalance(userID string, amount float64, transactionType string) error {
	return db.WithTransaction(func(tx *sql.Tx) error {
		// Update wallet balance
		_, err := tx.Exec(`
			UPDATE wallets 
			SET balance = balance + $1, 
			    total_earned = CASE WHEN $1 > 0 THEN total_earned + $1 ELSE total_earned END,
			    total_spent = CASE WHEN $1 < 0 THEN total_spent + ABS($1) ELSE total_spent END,
			    updated_at = NOW()
			WHERE user_id = $2`, amount, userID)
		
		if err != nil {
			return err
		}
		
		// Get wallet ID for transaction record
		var walletID string
		err = tx.QueryRow("SELECT id FROM wallets WHERE user_id = $1", userID).Scan(&walletID)
		if err != nil {
			return err
		}
		
		// Create transaction record
		_, err = tx.Exec(`
			INSERT INTO wallet_transactions (id, wallet_id, type, amount, description, status)
			VALUES (gen_random_uuid(), $1, $2, $3, $4, 'completed')`,
			walletID, transactionType, amount, fmt.Sprintf("Wallet %s", transactionType))
		
		return err
	})
}

// Job queries
func (db *DB) GetJobs(filters map[string]interface{}) ([]*models.Microjob, error) {
	query := `
		SELECT id, user_id, category_id, title, description, requirements, budget_min, budget_max,
		       deadline, location, is_remote, status, priority, attachments, skills_required,
		       applications_count, views_count, created_at, updated_at
		FROM microjobs WHERE status = 'open'`
	
	args := []interface{}{}
	argCount := 0
	
	if category, ok := filters["category"]; ok && category != "" {
		argCount++
		query += fmt.Sprintf(" AND category_id = $%d", argCount)
		args = append(args, category)
	}
	
	if search, ok := filters["search"]; ok && search != "" {
		argCount++
		query += fmt.Sprintf(" AND (title ILIKE $%d OR description ILIKE $%d)", argCount, argCount)
		args = append(args, "%"+search.(string)+"%")
	}
	
	query += " ORDER BY created_at DESC LIMIT 50"
	
	rows, err := db.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	
	var jobs []*models.Microjob
	for rows.Next() {
		var job models.Microjob
		err := rows.Scan(
			&job.ID, &job.UserID, &job.CategoryID, &job.Title, &job.Description,
			&job.Requirements, &job.BudgetMin, &job.BudgetMax, &job.Deadline,
			&job.Location, &job.IsRemote, &job.Status, &job.Priority,
			&job.Attachments, &job.SkillsRequired, &job.ApplicationsCount,
			&job.ViewsCount, &job.CreatedAt, &job.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		jobs = append(jobs, &job)
	}
	
	return jobs, nil
}

func (db *DB) GetJobByID(id string) (*models.Microjob, error) {
	query := `
		SELECT id, user_id, category_id, title, description, requirements, budget_min, budget_max,
		       deadline, location, is_remote, status, priority, attachments, skills_required,
		       applications_count, views_count, created_at, updated_at
		FROM microjobs WHERE id = $1`
	
	var job models.Microjob
	err := db.QueryRow(query, id).Scan(
		&job.ID, &job.UserID, &job.CategoryID, &job.Title, &job.Description,
		&job.Requirements, &job.BudgetMin, &job.BudgetMax, &job.Deadline,
		&job.Location, &job.IsRemote, &job.Status, &job.Priority,
		&job.Attachments, &job.SkillsRequired, &job.ApplicationsCount,
		&job.ViewsCount, &job.CreatedAt, &job.UpdatedAt,
	)
	
	if err != nil {
		return nil, err
	}
	
	return &job, nil
}

// Admin settings queries
func (db *DB) GetAdminSetting(key string) (string, error) {
	var value string
	err := db.QueryRow("SELECT value FROM admin_settings WHERE key = $1", key).Scan(&value)
	return value, err
}

func (db *DB) SetAdminSetting(key, value string) error {
	_, err := db.Exec(`
		INSERT INTO admin_settings (id, key, value) 
		VALUES (gen_random_uuid(), $1, $2)
		ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()`,
		key, value)
	return err
}

// Platform fee settings
func (db *DB) GetPlatformFeeSettings() (*models.PlatformFeeSettings, error) {
	query := `
		SELECT id, enabled, percentage, fixed_fee, minimum_fee, maximum_fee, created_at, updated_at
		FROM platform_fee_settings ORDER BY created_at DESC LIMIT 1`
	
	var settings models.PlatformFeeSettings
	err := db.QueryRow(query).Scan(
		&settings.ID, &settings.Enabled, &settings.Percentage, &settings.FixedFee,
		&settings.MinimumFee, &settings.MaximumFee, &settings.CreatedAt, &settings.UpdatedAt,
	)
	
	if err != nil {
		return nil, err
	}
	
	return &settings, nil
}

func (db *DB) UpdatePlatformFeeSettings(settings *models.PlatformFeeSettings) error {
	_, err := db.Exec(`
		INSERT INTO platform_fee_settings (id, enabled, percentage, fixed_fee, minimum_fee, maximum_fee)
		VALUES (gen_random_uuid(), $1, $2, $3, $4, $5)`,
		settings.Enabled, settings.Percentage, settings.FixedFee,
		settings.MinimumFee, settings.MaximumFee)
	return err
}
