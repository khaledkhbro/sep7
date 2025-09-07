package routes

import (
	"github.com/gofiber/fiber/v2"
	"microjob-backend/handlers"
	"microjob-backend/middleware"
)

func SetupAdminRoutes(app *fiber.App, adminHandler *handlers.AdminHandler) {
	admin := app.Group("/api/admin")
	
	// Apply authentication middleware to all admin routes
	admin.Use(middleware.AuthRequired())
	
	// Platform Fee Settings
	admin.Get("/platform-fee", adminHandler.GetPlatformFeeSettings)
	admin.Put("/platform-fee", adminHandler.UpdatePlatformFeeSettings)
	
	// Revision Settings
	admin.Get("/revision-settings", adminHandler.GetRevisionSettings)
	admin.Post("/revision-settings", adminHandler.UpdateRevisionSettings)
	
	// Commission Settings
	admin.Get("/commission", adminHandler.GetCommissionSettings)
	admin.Put("/commission", adminHandler.UpdateCommissionSettings)
	
	// Approval Settings
	admin.Get("/approval-settings", adminHandler.GetApprovalSettings)
	admin.Post("/approval-settings", adminHandler.UpdateApprovalSettings)
	
	// Feature Settings
	admin.Get("/feature-settings", adminHandler.GetFeatureSettings)
	admin.Post("/feature-settings", adminHandler.UpdateFeatureSettings)
	
	// Reservation Settings
	admin.Get("/reservation-settings", adminHandler.GetReservationSettings)
	admin.Post("/reservation-settings", adminHandler.UpdateReservationSettings)
	
	// Support Pricing
	admin.Get("/support-pricing", adminHandler.GetSupportPricing)
	admin.Post("/support-pricing", adminHandler.UpdateSupportPricing)
	
	// Reservation Violations
	admin.Get("/reservation-violations", adminHandler.GetReservationViolations)
}
