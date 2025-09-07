package services

import (
	"database/sql"
	"time"

	"microjob-backend/models"
)

type SupportService struct {
	db *sql.DB
}

func NewSupportService(db *sql.DB) *SupportService {
	return &SupportService{db: db}
}

func (ss *SupportService) GetUserTickets(userID string, limit, offset int) ([]models.SupportTicket, int, error) {
	// Get total count
	var total int
	countQuery := `SELECT COUNT(*) FROM support_tickets WHERE user_id = $1`
	err := ss.db.QueryRow(countQuery, userID).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	// Get tickets with pagination
	query := `
		SELECT st.id, st.user_id, st.subject, st.description, st.category, st.priority,
			   st.status, st.assigned_to, st.created_at, st.updated_at,
			   u.first_name, u.last_name, u.username
		FROM support_tickets st
		LEFT JOIN users u ON st.user_id = u.id
		WHERE st.user_id = $1
		ORDER BY st.created_at DESC
		LIMIT $2 OFFSET $3`
	
	rows, err := ss.db.Query(query, userID, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var tickets []models.SupportTicket
	for rows.Next() {
		var ticket models.SupportTicket
		var user models.User
		
		err := rows.Scan(&ticket.ID, &ticket.UserID, &ticket.Subject, &ticket.Description,
			&ticket.Category, &ticket.Priority, &ticket.Status, &ticket.AssignedTo,
			&ticket.CreatedAt, &ticket.UpdatedAt,
			&user.FirstName, &user.LastName, &user.Username)
		if err != nil {
			return nil, 0, err
		}

		ticket.User = &user
		tickets = append(tickets, ticket)
	}

	return tickets, total, nil
}

func (ss *SupportService) CreateTicket(ticket *models.SupportTicket) error {
	query := `
		INSERT INTO support_tickets (id, user_id, subject, description, category, priority, status, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`
	
	_, err := ss.db.Exec(query, ticket.ID, ticket.UserID, ticket.Subject, ticket.Description,
		ticket.Category, ticket.Priority, ticket.Status, ticket.CreatedAt, ticket.UpdatedAt)
	
	return err
}

func (ss *SupportService) GetTicketByID(ticketID string) (*models.SupportTicket, error) {
	query := `
		SELECT st.id, st.user_id, st.subject, st.description, st.category, st.priority,
			   st.status, st.assigned_to, st.created_at, st.updated_at,
			   u.first_name, u.last_name, u.username
		FROM support_tickets st
		LEFT JOIN users u ON st.user_id = u.id
		WHERE st.id = $1`
	
	var ticket models.SupportTicket
	var user models.User
	
	err := ss.db.QueryRow(query, ticketID).Scan(&ticket.ID, &ticket.UserID, &ticket.Subject,
		&ticket.Description, &ticket.Category, &ticket.Priority, &ticket.Status, &ticket.AssignedTo,
		&ticket.CreatedAt, &ticket.UpdatedAt,
		&user.FirstName, &user.LastName, &user.Username)
	
	if err != nil {
		return nil, err
	}

	ticket.User = &user
	return &ticket, nil
}

func (ss *SupportService) UpdateTicketStatus(ticketID, status string) error {
	query := `UPDATE support_tickets SET status = $1, updated_at = $2 WHERE id = $3`
	_, err := ss.db.Exec(query, status, time.Now(), ticketID)
	return err
}
