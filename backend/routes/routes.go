package routes

import (
	"github.com/gofiber/fiber/v2"

	"microjob-backend/config"
	"microjob-backend/database"
	"microjob-backend/cache"
	"microjob-backend/handlers"
	"microjob-backend/middleware"
	"microjob-backend/services"
)

func Setup(app *fiber.App, db *database.DB, cfg *config.Config, redisClient *cache.RedisClient, cacheService *services.CacheService) {
	reservationService := services.NewReservationService(db)
	workProofService := services.NewWorkProofService(db)
	walletService := services.NewWalletService(db)
	adminService := services.NewAdminService(db)

	authHandler := handlers.NewAuthHandler(db, cfg, cacheService)
	adminHandler := handlers.NewAdminHandler(db, cfg, cacheService)
	jobHandler := handlers.NewJobHandler(db, cfg, cacheService)
	walletHandler := handlers.NewWalletHandler(db, cfg)
	cronHandler := handlers.NewCronHandler(reservationService, workProofService, walletService, adminService)

	// Health check
	app.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"status": "ok"})
	})

	// API routes
	api := app.Group("/api")

	// Auth routes (no middleware needed)
	auth := api.Group("/auth")
	auth.Post("/login", authHandler.Login)
	auth.Post("/register", authHandler.Register)

	// Protected routes
	protected := api.Group("", middleware.AuthMiddleware(cfg.JWTSecret))

	// Admin routes
	admin := protected.Group("/admin", middleware.AdminMiddleware())
	admin.Get("/approval-settings", adminHandler.GetApprovalSettings)
	admin.Put("/approval-settings", adminHandler.UpdateApprovalSettings)
	admin.Get("/commission", adminHandler.GetCommissionSettings)
	admin.Put("/commission", adminHandler.UpdateCommissionSettings)
	admin.Get("/feature-settings", adminHandler.GetFeatureSettings)
	admin.Post("/feature-settings", adminHandler.UpdateFeatureSettings)
	admin.Get("/platform-fee", adminHandler.GetPlatformFeeSettings)
	admin.Put("/platform-fee", adminHandler.UpdatePlatformFeeSettings)
	admin.Get("/reservation-settings", adminHandler.GetReservationSettings)
	admin.Post("/reservation-settings", adminHandler.UpdateReservationSettings)
	admin.Get("/reservation-violations", adminHandler.GetReservationViolations)
	admin.Delete("/reservation-violations", adminHandler.DeleteReservationViolations)
	admin.Get("/revision-settings", adminHandler.GetRevisionSettings)
	admin.Post("/revision-settings", adminHandler.UpdateRevisionSettings)
	admin.Get("/support-pricing", adminHandler.GetSupportPricing)
	admin.Put("/support-pricing", adminHandler.UpdateSupportPricing)

	// Job routes
	jobs := protected.Group("/jobs")
	jobs.Get("/", jobHandler.GetJobs)
	jobs.Put("/", jobHandler.UpdateJobWorkers)
	jobs.Post("/reserve", jobHandler.ReserveJob)

	// Reservation routes
	reservations := protected.Group("/reservations")
	reservations.Post("/cancel", jobHandler.CancelReservation)
	reservations.Post("/check-expiry", jobHandler.CheckReservationExpiry)
	reservations.Get("/cleanup", jobHandler.CleanupReservations)
	reservations.Post("/cleanup", jobHandler.CleanupReservations)
	reservations.Get("/user", jobHandler.GetUserReservations)

	// Work proof routes
	workProofs := protected.Group("/work-proofs")
	workProofs.Post("/approve", jobHandler.ApproveWorkProof)
	workProofs.Post("/reject", jobHandler.RejectWorkProof)
	workProofs.Post("/request-revision", jobHandler.RequestRevision)

	// Wallet/Chat routes
	chat := protected.Group("/chat")
	chat.Post("/money-transfer", walletHandler.ProcessMoneyTransfer)

	// Favorites routes
	favorites := protected.Group("/favorites")
	favorites.Get("/", jobHandler.GetFavorites)
	favorites.Post("/", jobHandler.AddFavorite)
	favorites.Delete("/", jobHandler.RemoveFavorite)

	// Referral routes
	referrals := protected.Group("/referrals")
	referrals.Get("/", authHandler.GetReferrals)
	referrals.Post("/generate-code", authHandler.GenerateReferralCode)

	// Support routes
	support := protected.Group("/support")
	support.Get("/tickets", adminHandler.GetSupportTickets)
	support.Post("/tickets", adminHandler.CreateSupportTicket)

	// Marketplace routes
	marketplace := protected.Group("/marketplace")
	marketplace.Get("/categories", jobHandler.GetMarketplaceCategories)
	marketplace.Post("/categories", jobHandler.CreateMarketplaceCategory)
	marketplace.Delete("/categories", jobHandler.DeleteMarketplaceCategory)

	// Cron routes (with cron auth)
	cron := api.Group("/cron", middleware.CronAuthMiddleware(cfg.CronSecret))
	cron.Get("/expire-reservations", cronHandler.ExpireReservations)
	cron.Post("/expire-reservations", cronHandler.ExpireReservations)
	cron.Get("/process-work-proof-timeouts", cronHandler.ProcessWorkProofTimeouts)
	cron.Post("/process-work-proof-timeouts", cronHandler.ProcessWorkProofTimeouts)

	// Manual cron trigger
	manualCron := api.Group("/manual-cron-trigger", middleware.CronAuthMiddleware(cfg.CronSecret))
	manualCron.Post("/", cronHandler.ManualCronTrigger)

	// Test cron routes
	testCron := api.Group("/test-cron")
	testCron.Get("/", cronHandler.TestCron)
	testCronNow := api.Group("/test-cron-now")
	testCronNow.Get("/", cronHandler.TestCronNow)
	testCronNow.Post("/", cronHandler.TestCronNow)
}
