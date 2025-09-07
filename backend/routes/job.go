package routes

import (
	"github.com/gofiber/fiber/v2"
	"microjob-backend/handlers"
	"microjob-backend/middleware"
)

func SetupJobRoutes(app *fiber.App, jobHandler *handlers.JobHandler) {
	jobs := app.Group("/api/jobs")
	
	// Public routes
	jobs.Get("/", jobHandler.GetJobs)
	jobs.Get("/:id", jobHandler.GetJobByID)
	
	// Protected routes
	jobs.Use(middleware.AuthRequired())
	
	// Job management
	jobs.Post("/", jobHandler.CreateJob)
	jobs.Put("/", jobHandler.UpdateJobWorkers)
	jobs.Post("/reserve", jobHandler.CreateJobReservation)
	
	// Job applications
	jobs.Post("/:id/apply", jobHandler.ApplyToJob)
	jobs.Get("/:id/applications", jobHandler.GetJobApplications)
	jobs.Put("/applications/:applicationId", jobHandler.UpdateApplicationStatus)
	
	// Work proofs
	jobs.Post("/work-proofs", jobHandler.SubmitWorkProof)
	jobs.Get("/:id/work-proofs", jobHandler.GetWorkProofs)
	
	// Work proof actions
	workProofs := app.Group("/api/work-proofs")
	workProofs.Use(middleware.AuthRequired())
	
	workProofs.Post("/approve", jobHandler.ApproveWorkProof)
	workProofs.Post("/reject", jobHandler.RejectWorkProof)
	workProofs.Post("/request-revision", jobHandler.RequestRevision)
}
