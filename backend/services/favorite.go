package services

import (
	"database/sql"
	"time"

	"github.com/google/uuid"
	"microjob-backend/models"
)

type FavoriteService struct {
	db *sql.DB
}

func NewFavoriteService(db *sql.DB) *FavoriteService {
	return &FavoriteService{db: db}
}

func (fs *FavoriteService) GetUserFavorites(userID string) ([]models.UserFavorite, error) {
	query := `
		SELECT uf.id, uf.job_id, uf.created_at,
			   j.id, j.title, j.description, j.budget_min, j.budget_max, j.location,
			   j.is_remote, j.required_workers, j.created_at, j.thumbnail, j.category_id,
			   c.name, c.slug,
			   u.id, u.first_name, u.last_name, u.username, u.is_verified
		FROM user_favorites uf
		LEFT JOIN jobs j ON uf.job_id = j.id
		LEFT JOIN categories c ON j.category_id = c.id
		LEFT JOIN users u ON j.user_id = u.id
		WHERE uf.user_id = $1
		ORDER BY uf.created_at DESC`
	
	rows, err := fs.db.Query(query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var favorites []models.UserFavorite
	for rows.Next() {
		var favorite models.UserFavorite
		var job models.Job
		var user models.User
		var categoryName, categorySlug sql.NullString
		
		err := rows.Scan(&favorite.ID, &favorite.JobID, &favorite.CreatedAt,
			&job.ID, &job.Title, &job.Description, &job.BudgetMin, &job.BudgetMax,
			&job.Location, &job.IsRemote, &job.RequiredWorkers, &job.CreatedAt,
			&job.Thumbnail, &job.CategoryID, &categoryName, &categorySlug,
			&user.ID, &user.FirstName, &user.LastName, &user.Username, &user.IsVerified)
		if err != nil {
			return nil, err
		}

		if categoryName.Valid {
			job.CategoryName = categoryName.String
		}
		if categorySlug.Valid {
			job.CategorySlug = categorySlug.String
		}

		job.User = &user
		favorite.Job = &job
		favorites = append(favorites, favorite)
	}

	return favorites, nil
}

func (fs *FavoriteService) JobExists(jobID string) (bool, error) {
	var exists bool
	query := `SELECT EXISTS(SELECT 1 FROM jobs WHERE id = $1)`
	err := fs.db.QueryRow(query, jobID).Scan(&exists)
	return exists, err
}

func (fs *FavoriteService) IsFavorited(userID, jobID string) (bool, error) {
	var exists bool
	query := `SELECT EXISTS(SELECT 1 FROM user_favorites WHERE user_id = $1 AND job_id = $2)`
	err := fs.db.QueryRow(query, userID, jobID).Scan(&exists)
	return exists, err
}

func (fs *FavoriteService) AddFavorite(userID, jobID string) (*models.UserFavorite, error) {
	favorite := &models.UserFavorite{
		ID:        uuid.New().String(),
		UserID:    userID,
		JobID:     jobID,
		CreatedAt: time.Now(),
	}

	query := `INSERT INTO user_favorites (id, user_id, job_id, created_at) VALUES ($1, $2, $3, $4)`
	_, err := fs.db.Exec(query, favorite.ID, favorite.UserID, favorite.JobID, favorite.CreatedAt)
	
	return favorite, err
}

func (fs *FavoriteService) RemoveFavorite(userID, jobID string) error {
	query := `DELETE FROM user_favorites WHERE user_id = $1 AND job_id = $2`
	_, err := fs.db.Exec(query, userID, jobID)
	return err
}
