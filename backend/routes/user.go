package routes

import (
	"github.com/gofiber/fiber/v2"
	"microjob-backend/handlers"
	"microjob-backend/middleware"
)

func SetupUserRoutes(app *fiber.App, userHandler *handlers.UserHandler) {
	// Favorites
	favorites := app.Group("/api/favorites")
	favorites.Use(middleware.AuthRequired())
	
	favorites.Get("/", userHandler.GetFavorites)
	favorites.Post("/", userHandler.AddFavorite)
	favorites.Delete("/", userHandler.RemoveFavorite)
	
	// Referrals
	referrals := app.Group("/api/referrals")
	referrals.Use(middleware.AuthRequired())
	
	referrals.Get("/", userHandler.GetReferrals)
	referrals.Post("/generate-code", userHandler.GenerateReferralCode)
	
	// Chat Money Transfer
	chat := app.Group("/api/chat")
	chat.Use(middleware.AuthRequired())
	
	chat.Post("/money-transfer", userHandler.SendMoneyTransfer)
	
	// Reservations
	reservations := app.Group("/api/reservations")
	reservations.Use(middleware.AuthRequired())
	
	reservations.Get("/user", userHandler.GetUserReservations)
	reservations.Post("/cancel", userHandler.CancelReservation)
	reservations.Get("/check-expiry", userHandler.CheckReservationExpiry)
	reservations.Post("/cleanup", userHandler.CleanupReservations)
	
	// Support Tickets
	support := app.Group("/api/support")
	support.Use(middleware.AuthRequired())
	
	support.Get("/tickets", userHandler.GetSupportTickets)
	support.Post("/tickets", userHandler.CreateSupportTicket)
	
	// Marketplace Categories (public)
	marketplace := app.Group("/api/marketplace")
	marketplace.Get("/categories", userHandler.GetMarketplaceCategories)
}
