package services

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"time"

	"github.com/google/uuid"
	"microjob-backend/models"
)

type WorkProofService struct {
	db *sql.DB
}

func NewWorkProofService(db *sql.DB) *WorkProofService {
	return &WorkProofService{db: db}
}

func (wps *WorkProofService) CreateWorkProof(workProof *models.WorkProof) error {
	// Convert file arrays to JSON
	proofFilesJSON, _ := json.Marshal(workProof.ProofFiles)
	proofLinksJSON, _ := json.Marshal(workProof.ProofLinks)
	screenshotsJSON, _ := json.Marshal(workProof.Screenshots)
	attachmentsJSON, _ := json.Marshal(workProof.Attachments)

	query := `
		INSERT INTO work_proofs (id, job_id, application_id, worker_id, employer_id, title,
			description, submission_text, proof_files, proof_links, screenshots, attachments,
			status, submitted_at, payment_amount, submission_number, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)`
	
	_, err := wps.db.Exec(query, workProof.ID, workProof.JobID, workProof.ApplicationID,
		workProof.WorkerID, workProof.EmployerID, workProof.Title, workProof.Description,
		workProof.SubmissionText, proofFilesJSON, proofLinksJSON, screenshotsJSON, attachmentsJSON,
		workProof.Status, workProof.SubmittedAt, workProof.PaymentAmount, workProof.SubmissionNumber,
		workProof.CreatedAt, workProof.UpdatedAt)
	
	return err
}

func (wps *WorkProofService) GetWorkProofByID(proofID string) (*models.WorkProof, error) {
	query := `
		SELECT wp.id, wp.job_id, wp.application_id, wp.worker_id, wp.employer_id, wp.title,
			   wp.description, wp.submission_text, wp.proof_files, wp.proof_links, wp.screenshots,
			   wp.attachments, wp.status, wp.submitted_at, wp.reviewed_at, wp.review_feedback,
			   wp.payment_amount, wp.submission_number, wp.revision_count, wp.revision_deadline,
			   wp.rejection_deadline, wp.worker_response, wp.worker_response_at, wp.dispute_reason,
			   wp.dispute_evidence, wp.dispute_requested_action, wp.created_at, wp.updated_at,
			   u1.first_name, u1.last_name, u1.username, u1.avatar,
			   u2.first_name, u2.last_name, u2.username, u2.avatar
		FROM work_proofs wp
		LEFT JOIN users u1 ON wp.worker_id = u1.id
		LEFT JOIN users u2 ON wp.employer_id = u2.id
		WHERE wp.id = $1`
	
	var workProof models.WorkProof
	var worker, employer models.User
	var proofFilesJSON, proofLinksJSON, screenshotsJSON, attachmentsJSON []byte
	
	err := wps.db.QueryRow(query, proofID).Scan(
		&workProof.ID, &workProof.JobID, &workProof.ApplicationID, &workProof.WorkerID,
		&workProof.EmployerID, &workProof.Title, &workProof.Description, &workProof.SubmissionText,
		&proofFilesJSON, &proofLinksJSON, &screenshotsJSON, &attachmentsJSON,
		&workProof.Status, &workProof.SubmittedAt, &workProof.ReviewedAt, &workProof.ReviewFeedback,
		&workProof.PaymentAmount, &workProof.SubmissionNumber, &workProof.RevisionCount,
		&workProof.RevisionDeadline, &workProof.RejectionDeadline, &workProof.WorkerResponse,
		&workProof.WorkerResponseAt, &workProof.DisputeReason, &workProof.DisputeEvidence,
		&workProof.DisputeRequestedAction, &workProof.CreatedAt, &workProof.UpdatedAt,
		&worker.FirstName, &worker.LastName, &worker.Username, &worker.Avatar,
		&employer.FirstName, &employer.LastName, &employer.Username, &employer.Avatar,
	)
	
	if err != nil {
		return nil, err
	}

	// Parse JSON arrays
	json.Unmarshal(proofFilesJSON, &workProof.ProofFiles)
	json.Unmarshal(proofLinksJSON, &workProof.ProofLinks)
	json.Unmarshal(screenshotsJSON, &workProof.Screenshots)
	json.Unmarshal(attachmentsJSON, &workProof.Attachments)

	workProof.Worker = &worker
	workProof.Employer = &employer
	
	return &workProof, nil
}

func (wps *WorkProofService) ApproveWorkProof(proofID, reviewNotes string, walletService *WalletService) error {
	tx, err := wps.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	// Get work proof details
	workProof, err := wps.GetWorkProofByID(proofID)
	if err != nil {
		return err
	}

	// Update work proof status
	query := `
		UPDATE work_proofs 
		SET status = 'approved', reviewed_at = $1, review_feedback = $2, updated_at = $1
		WHERE id = $3`
	
	_, err = tx.Exec(query, time.Now(), reviewNotes, proofID)
	if err != nil {
		return err
	}

	// Process payment from employer to worker
	err = walletService.ProcessPayment(
		workProof.EmployerID,
		workProof.WorkerID,
		workProof.PaymentAmount,
		fmt.Sprintf("Payment for approved work: %s", workProof.Title),
		proofID,
		"work_proof_payment",
	)
	if err != nil {
		return err
	}

	return tx.Commit()
}

func (wps *WorkProofService) RejectWorkProof(proofID, rejectionReason string, timeoutHours int) error {
	rejectionDeadline := time.Now().Add(time.Duration(timeoutHours) * time.Hour)
	
	query := `
		UPDATE work_proofs 
		SET status = 'rejected', reviewed_at = $1, review_feedback = $2, 
			rejection_deadline = $3, updated_at = $1
		WHERE id = $4`
	
	_, err := wps.db.Exec(query, time.Now(), rejectionReason, rejectionDeadline, proofID)
	return err
}

func (wps *WorkProofService) RequestRevision(proofID, revisionNotes string, timeoutHours int) error {
	revisionDeadline := time.Now().Add(time.Duration(timeoutHours) * time.Hour)
	
	query := `
		UPDATE work_proofs 
		SET status = 'revision_requested', reviewed_at = $1, review_feedback = $2,
			revision_deadline = $3, revision_count = COALESCE(revision_count, 0) + 1, updated_at = $1
		WHERE id = $4`
	
	_, err := wps.db.Exec(query, time.Now(), revisionNotes, revisionDeadline, proofID)
	return err
}

func (wps *WorkProofService) GetWorkProofsByJobID(jobID string) ([]models.WorkProof, error) {
	query := `
		SELECT wp.id, wp.job_id, wp.application_id, wp.worker_id, wp.employer_id, wp.title,
			   wp.description, wp.submission_text, wp.proof_files, wp.proof_links, wp.screenshots,
			   wp.attachments, wp.status, wp.submitted_at, wp.reviewed_at, wp.review_feedback,
			   wp.payment_amount, wp.submission_number, wp.created_at, wp.updated_at,
			   u.first_name, u.last_name, u.username, u.avatar
		FROM work_proofs wp
		LEFT JOIN users u ON wp.worker_id = u.id
		WHERE wp.job_id = $1
		ORDER BY wp.created_at DESC`
	
	rows, err := wps.db.Query(query, jobID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var workProofs []models.WorkProof
	for rows.Next() {
		var workProof models.WorkProof
		var worker models.User
		var proofFilesJSON, proofLinksJSON, screenshotsJSON, attachmentsJSON []byte
		
		err := rows.Scan(&workProof.ID, &workProof.JobID, &workProof.ApplicationID,
			&workProof.WorkerID, &workProof.EmployerID, &workProof.Title, &workProof.Description,
			&workProof.SubmissionText, &proofFilesJSON, &proofLinksJSON, &screenshotsJSON,
			&attachmentsJSON, &workProof.Status, &workProof.SubmittedAt, &workProof.ReviewedAt,
			&workProof.ReviewFeedback, &workProof.PaymentAmount, &workProof.SubmissionNumber,
			&workProof.CreatedAt, &workProof.UpdatedAt,
			&worker.FirstName, &worker.LastName, &worker.Username, &worker.Avatar)
		
		if err != nil {
			return nil, err
		}

		// Parse JSON arrays
		json.Unmarshal(proofFilesJSON, &workProof.ProofFiles)
		json.Unmarshal(proofLinksJSON, &workProof.ProofLinks)
		json.Unmarshal(screenshotsJSON, &workProof.Screenshots)
		json.Unmarshal(attachmentsJSON, &workProof.Attachments)

		workProof.Worker = &worker
		workProofs = append(workProofs, workProof)
	}

	return workProofs, nil
}

func (wps *WorkProofService) ProcessExpiredDeadlines(walletService *WalletService) (int, error) {
	now := time.Now()
	processedCount := 0

	// Auto-approve expired submitted work proofs
	query := `
		SELECT wp.id, wp.job_id, wp.submitted_at, j.manual_approval_days
		FROM work_proofs wp
		JOIN jobs j ON wp.job_id = j.id
		WHERE wp.status = 'submitted' AND j.approval_type = 'manual'`
	
	rows, err := wps.db.Query(query)
	if err != nil {
		return 0, err
	}
	defer rows.Close()

	for rows.Next() {
		var proofID, jobID string
		var submittedAt time.Time
		var approvalDays int
		
		err := rows.Scan(&proofID, &jobID, &submittedAt, &approvalDays)
		if err != nil {
			continue
		}

		approvalDeadline := submittedAt.Add(time.Duration(approvalDays) * 24 * time.Hour)
		if now.After(approvalDeadline) {
			err = wps.ApproveWorkProof(proofID, "Automatically approved due to deadline expiration", walletService)
			if err == nil {
				processedCount++
			}
		}
	}

	// Process expired rejection deadlines
	rejectionQuery := `
		UPDATE work_proofs 
		SET status = 'rejected_accepted', worker_response = 'accepted', 
			worker_response_at = $1, updated_at = $1
		WHERE status = 'rejected' AND rejection_deadline < $1`
	
	result, err := wps.db.Exec(rejectionQuery, now)
	if err == nil {
		if affected, _ := result.RowsAffected(); affected > 0 {
			processedCount += int(affected)
		}
	}

	// Process expired revision deadlines (auto-cancel)
	revisionQuery := `
		UPDATE work_proofs 
		SET status = 'cancelled_by_worker', worker_response = 'cancelled',
			worker_response_at = $1, updated_at = $1
		WHERE status = 'revision_requested' AND revision_deadline < $1`
	
	result, err = wps.db.Exec(revisionQuery, now)
	if err == nil {
		if affected, _ := result.RowsAffected(); affected > 0 {
			processedCount += int(affected)
		}
	}

	return processedCount, nil
}
