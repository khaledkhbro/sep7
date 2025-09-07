package services

import (
	"database/sql"
	"time"

	"github.com/google/uuid"
	"microjob-backend/models"
)

type NotificationService struct {
	db *sql.DB
}

func NewNotificationService(db *sql.DB) *NotificationService {
	return &NotificationService{db: db}
}

func (ns *NotificationService) CreateNotification(notification *models.Notification) error {
	query := `
		INSERT INTO notifications (id, user_id, type, title, description, action_url, 
			is_read, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`
	
	_, err := ns.db.Exec(query, notification.ID, notification.UserID, notification.Type,
		notification.Title, notification.Description, notification.ActionURL,
		notification.IsRead, notification.CreatedAt, notification.UpdatedAt)
	
	return err
}

func (ns *NotificationService) GetNotificationsByUserID(userID string, limit, offset int) ([]models.Notification, error) {
	query := `
		SELECT id, user_id, type, title, description, action_url, is_read, created_at, updated_at
		FROM notifications 
		WHERE user_id = $1 
		ORDER BY created_at DESC 
		LIMIT $2 OFFSET $3`
	
	rows, err := ns.db.Query(query, userID, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var notifications []models.Notification
	for rows.Next() {
		var notification models.Notification
		err := rows.Scan(&notification.ID, &notification.UserID, &notification.Type,
			&notification.Title, &notification.Description, &notification.ActionURL,
			&notification.IsRead, &notification.CreatedAt, &notification.UpdatedAt)
		if err != nil {
			return nil, err
		}
		notifications = append(notifications, notification)
	}

	return notifications, nil
}

func (ns *NotificationService) MarkAsRead(notificationID string) error {
	query := `UPDATE notifications SET is_read = true, updated_at = $1 WHERE id = $2`
	_, err := ns.db.Exec(query, time.Now(), notificationID)
	return err
}

func (ns *NotificationService) MarkAllAsRead(userID string) error {
	query := `UPDATE notifications SET is_read = true, updated_at = $1 WHERE user_id = $2 AND is_read = false`
	_, err := ns.db.Exec(query, time.Now(), userID)
	return err
}

func (ns *NotificationService) GetUnreadCount(userID string) (int, error) {
	var count int
	query := `SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = false`
	err := ns.db.QueryRow(query, userID).Scan(&count)
	return count, err
}
