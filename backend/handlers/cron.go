package handlers

import (
	"os"
	"strconv"
	"time"

	"github.com/gofiber/fiber/v2"
	"microjob-backend/services"
)

type CronHandler struct {
	reservationService *services.ReservationService
	workProofService   *services.WorkProofService
	walletService      *services.WalletService
	adminService       *services.AdminService
}

func NewCronHandler(reservationService *services.ReservationService, workProofService *services.WorkProofService,
	walletService *services.WalletService, adminService *services.AdminService) *CronHandler {
	return &CronHandler{
		reservationService: reservationService,
		workProofService:   workProofService,
		walletService:      walletService,
		adminService:       adminService,
	}
}

// Expire Reservations Cron Job
func (ch *CronHandler) ExpireReservations(c *fiber.Ctx) error {
	// Verify cron authorization
	authHeader := c.Get("Authorization")
	expectedAuth := "Bearer " + os.Getenv("CRON_SECRET")
	
	if os.Getenv("CRON_SECRET") == "" {
		return c.Status(500).JSON(fiber.Map{"error": "Server configuration error"})
	}
	
	if authHeader != expectedAuth {
		return c.Status(401).JSON(fiber.Map{"error": "Unauthorized"})
	}

	// Process expired reservations
	processed, err := ch.reservationService.CleanupExpiredReservations()
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to process expired reservations"})
	}

	if processed == 0 {
		return c.JSON(fiber.Map{
			"success":   true,
			"message":   "No expired reservations found",
			"processed": 0,
		})
	}

	// TODO: Create violation records for users with multiple expired reservations
	// This would require additional database queries and business logic

	return c.JSON(fiber.Map{
		"success":   true,
		"message":   "Processed " + strconv.Itoa(processed) + " expired reservations",
		"processed": processed,
		"timestamp": time.Now().Format(time.RFC3339),
	})
}

// Process Work Proof Timeouts Cron Job
func (ch *CronHandler) ProcessWorkProofTimeouts(c *fiber.Ctx) error {
	// Verify cron authorization
	authHeader := c.Get("Authorization")
	expectedAuth := "Bearer " + os.Getenv("CRON_SECRET")
	
	if os.Getenv("CRON_SECRET") == "" {
		return c.Status(500).JSON(fiber.Map{"error": "Server configuration error"})
	}
	
	if authHeader != expectedAuth {
		return c.Status(401).JSON(fiber.Map{"error": "Unauthorized"})
	}

	// Get revision settings for refund configuration
	revisionSettings, err := ch.adminService.GetRevisionSettings()
	if err != nil {
		// Use default settings if unable to fetch
		revisionSettings = map[string]interface{}{
			"enableAutomaticRefunds":      true,
			"refundOnRevisionTimeout":     true,
			"refundOnRejectionTimeout":    true,
			"maxRevisionRequests":         2,
			"revisionRequestTimeoutValue": 24,
			"revisionRequestTimeoutUnit":  "hours",
			"rejectionResponseTimeoutValue": 24,
			"rejectionResponseTimeoutUnit":  "hours",
		}
	}

	// Process expired work proof deadlines
	processed, err := ch.workProofService.ProcessExpiredDeadlines(ch.walletService)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error":     "Internal server error",
			"details":   err.Error(),
			"timestamp": time.Now().Format(time.RFC3339),
		})
	}

	return c.JSON(fiber.Map{
		"success":        true,
		"message":        "Work proof timeout processing completed",
		"processedCount": processed,
		"timestamp":      time.Now().Format(time.RFC3339),
		"settings": fiber.Map{
			"automaticRefundsEnabled": revisionSettings["enableAutomaticRefunds"],
			"refundOnRevisionTimeout": revisionSettings["refundOnRevisionTimeout"],
			"refundOnRejectionTimeout": revisionSettings["refundOnRejectionTimeout"],
		},
	})
}

// Manual Cron Trigger (for testing)
func (ch *CronHandler) ManualCronTrigger(c *fiber.Ctx) error {
	var body struct {
		JobType string `json:"jobType"`
	}

	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request body"})
	}

	switch body.JobType {
	case "expire-reservations":
		return ch.ExpireReservations(c)
	case "process-work-proof-timeouts":
		return ch.ProcessWorkProofTimeouts(c)
	default:
		return c.Status(400).JSON(fiber.Map{"error": "Invalid job type"})
	}
}

// Test Cron (for development)
func (ch *CronHandler) TestCron(c *fiber.Ctx) error {
	return c.JSON(fiber.Map{
		"success":   true,
		"message":   "Cron test endpoint working",
		"timestamp": time.Now().Format(time.RFC3339),
		"server":    "Go/Fiber Backend",
	})
}

// Test Cron Now (immediate execution for testing)
func (ch *CronHandler) TestCronNow(c *fiber.Ctx) error {
	// Run both cron jobs immediately for testing
	reservationProcessed, err := ch.reservationService.CleanupExpiredReservations()
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to process reservations: " + err.Error()})
	}

	workProofProcessed, err := ch.workProofService.ProcessExpiredDeadlines(ch.walletService)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to process work proofs: " + err.Error()})
	}

	return c.JSON(fiber.Map{
		"success":   true,
		"message":   "Test cron jobs executed successfully",
		"results": fiber.Map{
			"reservationsProcessed": reservationProcessed,
			"workProofsProcessed":   workProofProcessed,
		},
		"timestamp": time.Now().Format(time.RFC3339),
	})
}
