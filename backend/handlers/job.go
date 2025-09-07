package handlers

import (
	"fmt"
	"strconv"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"microjob-backend/config"
	"microjob-backend/database"
	"microjob-backend/models"
	"microjob-backend/services"
)

type JobHandler struct {
	db                 *database.DB
	cfg                *config.Config
	cacheService       *services.CacheService
	jobService         *services.JobService
	walletService      *services.WalletService
	workProofService   *services.WorkProofService
	reservationService *services.ReservationService
}

func NewJobHandler(db *database.DB, cfg *config.Config, cacheService *services.CacheService) *JobHandler {
	return &JobHandler{
		db:                 db,
		cfg:                cfg,
		cacheService:       cacheService,
		jobService:         services.NewJobService(db),
		walletService:      services.NewWalletService(db),
		workProofService:   services.NewWorkProofService(db),
		reservationService: services.NewReservationService(db),
	}
}

// Update Job Workers
func (jh *JobHandler) UpdateJobWorkers(c *fiber.Ctx) error {
	var body struct {
		JobID          string `json:"jobId"`
		NewWorkerCount int    `json:"newWorkerCount"`
		UserID         string `json:"userId"`
	}

	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"success": false, "message": "Invalid request body"})
	}

	if body.JobID == "" || body.NewWorkerCount <= 0 || body.UserID == "" {
		return c.Status(400).JSON(fiber.Map{"success": false, "message": "Missing required fields"})
	}

	result, err := jh.jobService.UpdateJobWorkers(body.JobID, body.NewWorkerCount, body.UserID)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"success": false, "message": err.Error()})
	}

	jh.cacheService.InvalidateJobCache(body.JobID)

	return c.JSON(result)
}

// Create Job Reservation
func (jh *JobHandler) ReserveJob(c *fiber.Ctx) error {
	userID := c.Locals("userID").(string)
	if userID == "" {
		return c.Status(401).JSON(fiber.Map{"error": "User ID required"})
	}

	var body struct {
		JobID              string `json:"jobId"`
		ReservationMinutes int    `json:"reservationMinutes"`
	}

	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request body"})
	}

	settings, err := jh.reservationService.GetReservationSettings()
	if err != nil || !settings.IsEnabled {
		return c.Status(400).JSON(fiber.Map{"error": "Job reservation is currently disabled"})
	}

	reservationMinutes := body.ReservationMinutes
	if reservationMinutes <= 0 {
		reservationMinutes = settings.DefaultReservationMinutes
	}

	reservation, err := jh.reservationService.CreateReservation(body.JobID, userID, reservationMinutes)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to create reservation"})
	}

	return c.JSON(fiber.Map{
		"success":     true,
		"reservation": reservation,
		"expiresAt":   reservation.ExpiresAt,
	})
}

// Get Jobs with Redis caching
func (jh *JobHandler) GetJobs(c *fiber.Ctx) error {
	page, _ := strconv.Atoi(c.Query("page", "1"))
	limit, _ := strconv.Atoi(c.Query("limit", "20"))
	category := c.Query("category")
	status := c.Query("status")
	userID := c.Query("userId")
	
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}
	
	offset := (page - 1) * limit

	cacheKey := fmt.Sprintf("jobs:list:page_%d:limit_%d:cat_%s:status_%s:user_%s", 
		page, limit, category, status, userID)

	var cachedResult struct {
		Jobs  []models.Job `json:"jobs"`
		Page  int          `json:"page"`
		Limit int          `json:"limit"`
	}
	
	if err := jh.cacheService.GetSearchResults(cacheKey, &cachedResult); err == nil {
		return c.JSON(cachedResult)
	}

	var jobs []models.Job
	var err error

	if userID != "" {
		jobs, err = jh.jobService.GetJobsByUserID(userID, status, limit, offset)
	} else {
		jobs, err = jh.jobService.GetJobsWithFilters(category, status, limit, offset)
	}

	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to fetch jobs"})
	}

	result := fiber.Map{
		"jobs":  jobs,
		"page":  page,
		"limit": limit,
	}

	jh.cacheService.CacheSearchResults(cacheKey, result)

	return c.JSON(result)
}

// Get Job by ID with Redis caching
func (jh *JobHandler) GetJobByID(c *fiber.Ctx) error {
	jobID := c.Params("id")
	if jobID == "" {
		return c.Status(400).JSON(fiber.Map{"error": "Job ID required"})
	}

	var cachedJob models.Job
	if err := jh.cacheService.GetCachedJob(jobID, &cachedJob); err == nil {
		return c.JSON(fiber.Map{"job": cachedJob})
	}

	job, err := jh.jobService.GetJobByID(jobID)
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Job not found"})
	}

	jh.cacheService.CacheJob(jobID, job)

	return c.JSON(fiber.Map{"job": job})
}

// Get Favorites with caching
func (jh *JobHandler) GetFavorites(c *fiber.Ctx) error {
	userID := c.Locals("userID").(string)
	if userID == "" {
		return c.Status(401).JSON(fiber.Map{"error": "Unauthorized"})
	}

	cacheKey := fmt.Sprintf("favorites:user:%s", userID)
	var cachedFavorites []models.Job
	
	if err := jh.cacheService.Get(cacheKey, &cachedFavorites); err == nil {
		return c.JSON(fiber.Map{"favorites": cachedFavorites})
	}

	favorites, err := jh.jobService.GetUserFavorites(userID)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to fetch favorites"})
	}

	jh.cacheService.Set(cacheKey, favorites, 15*time.Minute)

	return c.JSON(fiber.Map{"favorites": favorites})
}

// Add Favorite
func (jh *JobHandler) AddFavorite(c *fiber.Ctx) error {
	userID := c.Locals("userID").(string)
	if userID == "" {
		return c.Status(401).JSON(fiber.Map{"error": "Unauthorized"})
	}

	var body struct {
		JobID string `json:"jobId"`
	}

	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request body"})
	}

	err := jh.jobService.AddFavorite(userID, body.JobID)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to add favorite"})
	}

	cacheKey := fmt.Sprintf("favorites:user:%s", userID)
	jh.cacheService.Delete(cacheKey)

	return c.JSON(fiber.Map{"success": true})
}

// Remove Favorite
func (jh *JobHandler) RemoveFavorite(c *fiber.Ctx) error {
	userID := c.Locals("userID").(string)
	if userID == "" {
		return c.Status(401).JSON(fiber.Map{"error": "Unauthorized"})
	}

	var body struct {
		JobID string `json:"jobId"`
	}

	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request body"})
	}

	err := jh.jobService.RemoveFavorite(userID, body.JobID)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to remove favorite"})
	}

	cacheKey := fmt.Sprintf("favorites:user:%s", userID)
	jh.cacheService.Delete(cacheKey)

	return c.JSON(fiber.Map{"success": true})
}

// Get Marketplace Categories with caching
func (jh *JobHandler) GetMarketplaceCategories(c *fiber.Ctx) error {
	var cachedCategories []models.Category
	
	if err := jh.cacheService.Get("categories", &cachedCategories); err == nil {
		return c.JSON(fiber.Map{"categories": cachedCategories})
	}

	categories, err := jh.jobService.GetMarketplaceCategories()
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to fetch categories"})
	}

	jh.cacheService.Set("categories", categories, 1*time.Hour)

	return c.JSON(fiber.Map{"categories": categories})
}

// Create Marketplace Category
func (jh *JobHandler) CreateMarketplaceCategory(c *fiber.Ctx) error {
	var body struct {
		Name        string `json:"name"`
		Description string `json:"description"`
		ParentID    string `json:"parentId"`
	}

	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request body"})
	}

	err := jh.jobService.CreateMarketplaceCategory(body.Name, body.Description, body.ParentID)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to create category"})
	}

	jh.cacheService.Delete("categories")

	return c.JSON(fiber.Map{"success": true})
}

// Delete Marketplace Category
func (jh *JobHandler) DeleteMarketplaceCategory(c *fiber.Ctx) error {
	var body struct {
		CategoryID string `json:"categoryId"`
	}

	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request body"})
	}

	err := jh.jobService.DeleteMarketplaceCategory(body.CategoryID)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to delete category"})
	}

	jh.cacheService.Delete("categories")

	return c.JSON(fiber.Map{"success": true})
}

// Create Job
func (jh *JobHandler) CreateJob(c *fiber.Ctx) error {
	userID := c.Locals("userID").(string)
	if userID == "" {
		return c.Status(401).JSON(fiber.Map{"error": "Unauthorized"})
	}

	var jobData struct {
		Title                   string  `json:"title"`
		Description             string  `json:"description"`
		CategoryID              string  `json:"categoryId"`
		SubcategoryID           *string `json:"subcategoryId"`
		BudgetMin               float64 `json:"budgetMin"`
		BudgetMax               float64 `json:"budgetMax"`
		Deadline                *string `json:"deadline"`
		ApprovalType            string  `json:"approvalType"`
		InstantApprovalEnabled  bool    `json:"instantApprovalEnabled"`
		ManualApprovalDays      int     `json:"manualApprovalDays"`
		RequiredWorkers         int     `json:"requiredWorkers"`
	}

	if err := c.BodyParser(&jobData); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request body"})
	}

	if jobData.Title == "" || jobData.Description == "" || jobData.CategoryID == "" {
		return c.Status(400).JSON(fiber.Map{"error": "Missing required fields"})
	}

	job := &models.Job{
		ID:                     uuid.New().String(),
		UserID:                 userID,
		Title:                  jobData.Title,
		Description:            jobData.Description,
		CategoryID:             jobData.CategoryID,
		SubcategoryID:          jobData.SubcategoryID,
		BudgetMin:              jobData.BudgetMin,
		BudgetMax:              jobData.BudgetMax,
		Status:                 "open",
		ApprovalType:           jobData.ApprovalType,
		InstantApprovalEnabled: jobData.InstantApprovalEnabled,
		ManualApprovalDays:     jobData.ManualApprovalDays,
		RequiredWorkers:        jobData.RequiredWorkers,
		CreatedAt:              time.Now(),
		UpdatedAt:              time.Now(),
	}

	if jobData.Deadline != nil && *jobData.Deadline != "" {
		if deadline, err := time.Parse(time.RFC3339, *jobData.Deadline); err == nil {
			job.Deadline = &deadline
		}
	}

	err := jh.jobService.CreateJob(job)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to create job"})
	}

	return c.Status(201).JSON(fiber.Map{
		"success": true,
		"job":     job,
	})
}

// Apply to Job
func (jh *JobHandler) ApplyToJob(c *fiber.Ctx) error {
	userID := c.Locals("userID").(string)
	if userID == "" {
		return c.Status(401).JSON(fiber.Map{"error": "Unauthorized"})
	}

	jobID := c.Params("id")
	if jobID == "" {
		return c.Status(400).JSON(fiber.Map{"error": "Job ID required"})
	}

	var applicationData struct {
		CoverLetter           string `json:"coverLetter"`
		ProposedBudget        float64 `json:"proposedBudget"`
		EstimatedCompletion   string `json:"estimatedCompletion"`
	}

	if err := c.BodyParser(&applicationData); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request body"})
	}

	estimatedCompletion, err := time.Parse(time.RFC3339, applicationData.EstimatedCompletion)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid estimated completion date"})
	}

	application := &models.JobApplication{
		ID:                  uuid.New().String(),
		JobID:               jobID,
		ApplicantID:         userID,
		CoverLetter:         applicationData.CoverLetter,
		ProposedBudget:      applicationData.ProposedBudget,
		EstimatedCompletion: estimatedCompletion,
		Status:              "pending",
		CreatedAt:           time.Now(),
		UpdatedAt:           time.Now(),
	}

	err = jh.jobService.CreateApplication(application)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to create application"})
	}

	return c.Status(201).JSON(fiber.Map{
		"success":     true,
		"application": application,
	})
}

// Get Job Applications
func (jh *JobHandler) GetJobApplications(c *fiber.Ctx) error {
	jobID := c.Params("id")
	if jobID == "" {
		return c.Status(400).JSON(fiber.Map{"error": "Job ID required"})
	}

	applications, err := jh.jobService.GetApplicationsByJobID(jobID)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to fetch applications"})
	}

	return c.JSON(fiber.Map{"applications": applications})
}

// Accept/Reject Application
func (jh *JobHandler) UpdateApplicationStatus(c *fiber.Ctx) error {
	userID := c.Locals("userID").(string)
	applicationID := c.Params("applicationId")
	
	var body struct {
		Status string `json:"status"`
	}

	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request body"})
	}

	if body.Status != "accepted" && body.Status != "rejected" {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid status"})
	}

	err := jh.jobService.UpdateApplicationStatus(applicationID, body.Status)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to update application status"})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"message": "Application status updated successfully",
	})
}

// Submit Work Proof
func (jh *JobHandler) SubmitWorkProof(c *fiber.Ctx) error {
	userID := c.Locals("userID").(string)
	if userID == "" {
		return c.Status(401).JSON(fiber.Map{"error": "Unauthorized"})
	}

	var workProofData struct {
		JobID            string   `json:"jobId"`
		ApplicationID    string   `json:"applicationId"`
		Title            string   `json:"title"`
		Description      string   `json:"description"`
		SubmissionText   string   `json:"submissionText"`
		ProofFiles       []string `json:"proofFiles"`
		ProofLinks       []string `json:"proofLinks"`
		Screenshots      []string `json:"screenshots"`
		Attachments      []string `json:"attachments"`
		PaymentAmount    float64  `json:"paymentAmount"`
	}

	if err := c.BodyParser(&workProofData); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request body"})
	}

	// Get job details to determine employer
	job, err := jh.jobService.GetJobByID(workProofData.JobID)
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Job not found"})
	}

	workProof := &models.WorkProof{
		ID:               uuid.New().String(),
		JobID:            workProofData.JobID,
		ApplicationID:    workProofData.ApplicationID,
		WorkerID:         userID,
		EmployerID:       job.UserID,
		Title:            workProofData.Title,
		Description:      workProofData.Description,
		SubmissionText:   workProofData.SubmissionText,
		ProofFiles:       workProofData.ProofFiles,
		ProofLinks:       workProofData.ProofLinks,
		Screenshots:      workProofData.Screenshots,
		Attachments:      workProofData.Attachments,
		Status:           "submitted",
		SubmittedAt:      time.Now(),
		PaymentAmount:    workProofData.PaymentAmount,
		SubmissionNumber: 1,
		CreatedAt:        time.Now(),
		UpdatedAt:        time.Now(),
	}

	// Check for instant approval
	if job.ApprovalType == "instant" && job.InstantApprovalEnabled {
		workProof.Status = "auto_approved"
		workProof.ReviewedAt = &workProof.SubmittedAt
		
		// Process instant payment
		err = jh.walletService.ProcessPayment(
			job.UserID,
			userID,
			workProofData.PaymentAmount,
			"Instant payment for: "+workProofData.Title,
			workProof.ID,
			"work_proof_payment",
		)
		if err != nil {
			return c.Status(500).JSON(fiber.Map{"error": "Failed to process instant payment"})
		}
	}

	err = jh.workProofService.CreateWorkProof(workProof)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to submit work proof"})
	}

	return c.Status(201).JSON(fiber.Map{
		"success":   true,
		"workProof": workProof,
	})
}

// Approve Work Proof
func (jh *JobHandler) ApproveWorkProof(c *fiber.Ctx) error {
	userID := c.Locals("userID").(string)
	if userID == "" {
		return c.Status(401).JSON(fiber.Map{"error": "Unauthorized"})
	}

	var body struct {
		ProofID     string  `json:"proofId"`
		ReviewNotes string  `json:"reviewNotes"`
		TipAmount   float64 `json:"tipAmount"`
	}

	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request body"})
	}

	if body.ProofID == "" {
		return c.Status(400).JSON(fiber.Map{"error": "Missing proof ID"})
	}

	err := jh.workProofService.ApproveWorkProof(body.ProofID, body.ReviewNotes, jh.walletService)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error":   "Failed to approve work proof",
			"details": err.Error(),
		})
	}

	approvedProof, err := jh.workProofService.GetWorkProofByID(body.ProofID)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to fetch approved proof"})
	}

	message := "Work approved! Payment of $" + strconv.FormatFloat(approvedProof.PaymentAmount, 'f', 2, 64) + " released to worker."
	
	if body.TipAmount > 0 {
		err = jh.walletService.ProcessPayment(
			userID,
			approvedProof.WorkerID,
			body.TipAmount,
			"Tip for excellent work: "+approvedProof.Title,
			body.ProofID,
			"tip_payment",
		)
		if err != nil {
			return c.Status(400).JSON(fiber.Map{
				"error": "Tip processing failed: " + err.Error(),
				"proof": approvedProof,
			})
		}
		message += " + $" + strconv.FormatFloat(body.TipAmount, 'f', 2, 64) + " tip"
	}

	return c.JSON(fiber.Map{
		"success": true,
		"proof":   approvedProof,
		"message": message,
	})
}

// Reject Work Proof
func (jh *JobHandler) RejectWorkProof(c *fiber.Ctx) error {
	var body struct {
		ProofID         string `json:"proofId"`
		RejectionReason string `json:"rejectionReason"`
		TimeoutHours    int    `json:"timeoutHours"`
	}

	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request body"})
	}

	if body.TimeoutHours <= 0 {
		body.TimeoutHours = 24
	}

	err := jh.workProofService.RejectWorkProof(body.ProofID, body.RejectionReason, body.TimeoutHours)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to reject work proof"})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"message": "Work proof rejected successfully",
	})
}

// Request Revision
func (jh *JobHandler) RequestRevision(c *fiber.Ctx) error {
	var body struct {
		ProofID       string `json:"proofId"`
		RevisionNotes string `json:"revisionNotes"`
		TimeoutHours  int    `json:"timeoutHours"`
	}

	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request body"})
	}

	if body.TimeoutHours <= 0 {
		body.TimeoutHours = 24
	}

	err := jh.workProofService.RequestRevision(body.ProofID, body.RevisionNotes, body.TimeoutHours)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"message": "Revision requested successfully",
	})
}

// Get Work Proofs for Job
func (jh *JobHandler) GetWorkProofs(c *fiber.Ctx) error {
	jobID := c.Params("id")
	if jobID == "" {
		return c.Status(400).JSON(fiber.Map{"error": "Job ID required"})
	}

	workProofs, err := jh.workProofService.GetWorkProofsByJobID(jobID)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to fetch work proofs"})
	}

	return c.JSON(fiber.Map{"workProofs": workProofs})
}

// Get User Reservations
func (jh *JobHandler) GetUserReservations(c *fiber.Ctx) error {
	userID := c.Locals("userID").(string)
	if userID == "" {
		return c.Status(401).JSON(fiber.Map{"error": "Unauthorized"})
	}

	reservations, err := jh.reservationService.GetUserReservations(userID)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to fetch reservations"})
	}

	return c.JSON(fiber.Map{"reservations": reservations})
}

// Cancel Reservation
func (jh *JobHandler) CancelReservation(c *fiber.Ctx) error {
	userID := c.Locals("userID").(string)
	if userID == "" {
		return c.Status(401).JSON(fiber.Map{"error": "Unauthorized"})
	}

	var body struct {
		ReservationID string `json:"reservationId"`
	}

	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request body"})
	}

	err := jh.reservationService.CancelReservation(body.ReservationID, userID)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to cancel reservation"})
	}

	return c.JSON(fiber.Map{"success": true})
}

// Check Reservation Expiry
func (jh *JobHandler) CheckReservationExpiry(c *fiber.Ctx) error {
	var body struct {
		ReservationID string `json:"reservationId"`
	}

	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request body"})
	}

	isExpired, err := jh.reservationService.CheckReservationExpiry(body.ReservationID)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to check expiry"})
	}

	return c.JSON(fiber.Map{"expired": isExpired})
}

// Cleanup Reservations
func (jh *JobHandler) CleanupReservations(c *fiber.Ctx) error {
	count, err := jh.reservationService.CleanupExpiredReservations()
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to cleanup reservations"})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"cleaned": count,
	})
}
