package routes

import (
	"github.com/gofiber/fiber/v2"
	"microjob-backend/handlers"
)

func SetupCronRoutes(app *fiber.App, cronHandler *handlers.CronHandler) {
	cron := app.Group("/api/cron")
	
	// Cron job endpoints (called by external cron services like Vercel Cron)
	cron.Get("/expire-reservations", cronHandler.ExpireReservations)
	cron.Post("/expire-reservations", cronHandler.ExpireReservations)
	
	cron.Get("/process-work-proof-timeouts", cronHandler.ProcessWorkProofTimeouts)
	cron.Post("/process-work-proof-timeouts", cronHandler.ProcessWorkProofTimeouts)
	
	// Manual trigger endpoints (for admin/testing)
	cron.Post("/manual-cron-trigger", cronHandler.ManualCronTrigger)
	cron.Get("/test-cron", cronHandler.TestCron)
	cron.Get("/test-cron-now", cronHandler.TestCronNow)
	cron.Post("/test-cron-now", cronHandler.TestCronNow)
}
