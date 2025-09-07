package database

import (
	"database/sql"
	"fmt"

	"microjob-backend/models"
)

// Authentication-related database queries

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

func (db *DB) GetUserByUsername(username string) (*models.User, error) {
	query := `
		SELECT id, email, password_hash, first_name, last_name, username, phone, 
		       avatar_url, bio, location, skills, rating, total_reviews, 
		       is_verified, is_active, user_type, created_at, updated_at
		FROM users WHERE username = $1 AND is_active = true`
	
	var user models.User
	err := db.QueryRow(query, username).Scan(
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
		INSERT INTO users (id, email, password_hash, first_name, last_name, username, user_type, skills)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		RETURNING created_at, updated_at`
	
	return db.QueryRow(query, user.ID, user.Email, user.PasswordHash, 
		user.FirstName, user.LastName, user.Username, user.UserType, user.Skills).Scan(
		&user.CreatedAt, &user.UpdatedAt)
}

func (db *DB) UpdateUser(userID string, updates map[string]interface{}) error {
	if len(updates) == 0 {
		return fmt.Errorf("no updates provided")
	}

	// Build dynamic query
	setParts := []string{}
	args := []interface{}{}
	argIndex := 1

	for field, value := range updates {
		setParts = append(setParts, fmt.Sprintf("%s = $%d", field, argIndex))
		args = append(args, value)
		argIndex++
	}

	// Add updated_at
	setParts = append(setParts, fmt.Sprintf("updated_at = NOW()"))
	
	// Add WHERE clause
	args = append(args, userID)
	whereClause := fmt.Sprintf("WHERE id = $%d", argIndex)

	query := fmt.Sprintf("UPDATE users SET %s %s", 
		fmt.Sprintf("%s", setParts), whereClause)

	_, err := db.Exec(query, args...)
	return err
}

func (db *DB) SuspendUser(userID, reason, suspendedBy string) error {
	return db.WithTransaction(func(tx *sql.Tx) error {
		// Update user type to suspended
		_, err := tx.Exec(`
			UPDATE users 
			SET user_type = 'suspended', updated_at = NOW()
			WHERE id = $1`, userID)
		if err != nil {
			return err
		}

		// Log suspension reason (you might want to create a separate table for this)
		_, err = tx.Exec(`
			INSERT INTO admin_settings (id, key, value)
			VALUES (gen_random_uuid(), $1, $2)`,
			fmt.Sprintf("suspension_%s", userID),
			fmt.Sprintf("reason:%s|by:%s|at:%s", reason, suspendedBy, "NOW()"))
		
		return err
	})
}

func (db *DB) ActivateUser(userID string) error {
	_, err := db.Exec(`
		UPDATE users 
		SET user_type = 'user', updated_at = NOW()
		WHERE id = $1`, userID)
	return err
}

func (db *DB) GetAllUsers(limit, offset int) ([]*models.User, error) {
	query := `
		SELECT id, email, first_name, last_name, username, phone, 
		       avatar_url, bio, location, skills, rating, total_reviews, 
		       is_verified, is_active, user_type, created_at, updated_at
		FROM users 
		ORDER BY created_at DESC
		LIMIT $1 OFFSET $2`
	
	rows, err := db.Query(query, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []*models.User
	for rows.Next() {
		var user models.User
		err := rows.Scan(
			&user.ID, &user.Email, &user.FirstName, &user.LastName,
			&user.Username, &user.Phone, &user.AvatarURL, &user.Bio, &user.Location,
			&user.Skills, &user.Rating, &user.TotalReviews, &user.IsVerified,
			&user.IsActive, &user.UserType, &user.CreatedAt, &user.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		users = append(users, &user)
	}

	return users, nil
}

func (db *DB) GetUserStats() (map[string]int, error) {
	stats := make(map[string]int)

	// Total users
	err := db.QueryRow("SELECT COUNT(*) FROM users WHERE is_active = true").Scan(&stats["total"])
	if err != nil {
		return nil, err
	}

	// Active users (not suspended)
	err = db.QueryRow("SELECT COUNT(*) FROM users WHERE is_active = true AND user_type != 'suspended'").Scan(&stats["active"])
	if err != nil {
		return nil, err
	}

	// Suspended users
	err = db.QueryRow("SELECT COUNT(*) FROM users WHERE user_type = 'suspended'").Scan(&stats["suspended"])
	if err != nil {
		return nil, err
	}

	// Verified users
	err = db.QueryRow("SELECT COUNT(*) FROM users WHERE is_verified = true AND is_active = true").Scan(&stats["verified"])
	if err != nil {
		return nil, err
	}

	// Admin users
	err = db.QueryRow("SELECT COUNT(*) FROM users WHERE user_type = 'admin' AND is_active = true").Scan(&stats["admin"])
	if err != nil {
		return nil, err
	}

	return stats, nil
}
