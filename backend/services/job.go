package services

import (
	"database/sql"
	"fmt"
	"time"

	"github.com/google/uuid"
	"microjob-backend/models"
)

type JobService struct {
	db *sql.DB
}

func NewJobService(db *sql.DB) *JobService {
	return &JobService{db: db}
}

func (js *JobService) CreateJob(job *models.Job) error {
	query := `
		INSERT INTO jobs (id, user_id, title, description, category_id, subcategory_id, 
			budget_min, budget_max, deadline, status, approval_type, instant_approval_enabled,
			manual_approval_days, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`
	
	_, err := js.db.Exec(query, job.ID, job.UserID, job.Title, job.Description, job.CategoryID,
		job.SubcategoryID, job.BudgetMin, job.BudgetMax, job.Deadline, job.Status,
		job.ApprovalType, job.InstantApprovalEnabled, job.ManualApprovalDays,
		job.CreatedAt, job.UpdatedAt)
	
	return err
}

func (js *JobService) GetJobByID(jobID string) (*models.Job, error) {
	query := `
		SELECT j.id, j.user_id, j.title, j.description, j.category_id, j.subcategory_id,
			   j.budget_min, j.budget_max, j.deadline, j.status, j.approval_type,
			   j.instant_approval_enabled, j.manual_approval_days, j.created_at, j.updated_at,
			   u.first_name, u.last_name, u.username, u.avatar
		FROM jobs j
		LEFT JOIN users u ON j.user_id = u.id
		WHERE j.id = $1`
	
	var job models.Job
	var user models.User
	err := js.db.QueryRow(query, jobID).Scan(
		&job.ID, &job.UserID, &job.Title, &job.Description, &job.CategoryID, &job.SubcategoryID,
		&job.BudgetMin, &job.BudgetMax, &job.Deadline, &job.Status, &job.ApprovalType,
		&job.InstantApprovalEnabled, &job.ManualApprovalDays, &job.CreatedAt, &job.UpdatedAt,
		&user.FirstName, &user.LastName, &user.Username, &user.Avatar,
	)
	
	if err != nil {
		return nil, err
	}
	
	job.User = &user
	return &job, nil
}

func (js *JobService) GetJobsByUserID(userID string, status string, limit, offset int) ([]models.Job, error) {
	query := `
		SELECT id, user_id, title, description, category_id, subcategory_id,
			   budget_min, budget_max, deadline, status, approval_type,
			   instant_approval_enabled, manual_approval_days, created_at, updated_at
		FROM jobs 
		WHERE user_id = $1`
	
	args := []interface{}{userID}
	argCount := 1
	
	if status != "" {
		argCount++
		query += fmt.Sprintf(" AND status = $%d", argCount)
		args = append(args, status)
	}
	
	query += " ORDER BY created_at DESC"
	
	if limit > 0 {
		argCount++
		query += fmt.Sprintf(" LIMIT $%d", argCount)
		args = append(args, limit)
		
		if offset > 0 {
			argCount++
			query += fmt.Sprintf(" OFFSET $%d", argCount)
			args = append(args, offset)
		}
	}
	
	rows, err := js.db.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var jobs []models.Job
	for rows.Next() {
		var job models.Job
		err := rows.Scan(&job.ID, &job.UserID, &job.Title, &job.Description, &job.CategoryID,
			&job.SubcategoryID, &job.BudgetMin, &job.BudgetMax, &job.Deadline, &job.Status,
			&job.ApprovalType, &job.InstantApprovalEnabled, &job.ManualApprovalDays,
			&job.CreatedAt, &job.UpdatedAt)
		if err != nil {
			return nil, err
		}
		jobs = append(jobs, job)
	}

	return jobs, nil
}

func (js *JobService) CreateApplication(application *models.JobApplication) error {
	query := `
		INSERT INTO job_applications (id, job_id, applicant_id, cover_letter, proposed_budget,
			estimated_completion, status, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`
	
	_, err := js.db.Exec(query, application.ID, application.JobID, application.ApplicantID,
		application.CoverLetter, application.ProposedBudget, application.EstimatedCompletion,
		application.Status, application.CreatedAt, application.UpdatedAt)
	
	return err
}

func (js *JobService) GetApplicationsByJobID(jobID string) ([]models.JobApplication, error) {
	query := `
		SELECT ja.id, ja.job_id, ja.applicant_id, ja.cover_letter, ja.proposed_budget,
			   ja.estimated_completion, ja.status, ja.created_at, ja.updated_at,
			   u.first_name, u.last_name, u.username, u.avatar
		FROM job_applications ja
		LEFT JOIN users u ON ja.applicant_id = u.id
		WHERE ja.job_id = $1
		ORDER BY ja.created_at DESC`
	
	rows, err := js.db.Query(query, jobID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var applications []models.JobApplication
	for rows.Next() {
		var application models.JobApplication
		var user models.User
		err := rows.Scan(&application.ID, &application.JobID, &application.ApplicantID,
			&application.CoverLetter, &application.ProposedBudget, &application.EstimatedCompletion,
			&application.Status, &application.CreatedAt, &application.UpdatedAt,
			&user.FirstName, &user.LastName, &user.Username, &user.Avatar)
		if err != nil {
			return nil, err
		}
		application.Applicant = &user
		applications = append(applications, application)
	}

	return applications, nil
}

func (js *JobService) UpdateApplicationStatus(applicationID, status string) error {
	query := `UPDATE job_applications SET status = $1, updated_at = $2 WHERE id = $3`
	_, err := js.db.Exec(query, status, time.Now(), applicationID)
	return err
}

func (js *JobService) UpdateJobStatus(jobID, status string) error {
	query := `UPDATE jobs SET status = $1, updated_at = $2 WHERE id = $3`
	_, err := js.db.Exec(query, status, time.Now(), jobID)
	return err
}
