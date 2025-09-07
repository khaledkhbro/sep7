package handlers

import (
	"strconv"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"microjob-backend/models"
	"microjob-backend/services"
)

type UserHandler struct {
	userService        *services.UserService
	favoriteService    *services.FavoriteService
	referralService    *services.ReferralService
	chatService        *services.ChatService
	walletService      *services.WalletService
	reservationService *services.ReservationService
	supportService     *services.SupportService
}

func NewUserHandler(userService *services.UserService, favoriteService *services.FavoriteService,
	referralService *services.ReferralService, chatService *services.ChatService,
	walletService *services.WalletService, reservationService *services.ReservationService,
	supportService *services.SupportService) *UserHandler {
	return &UserHandler{
		userService:        userService,
		favoriteService:    favoriteService,
		referralService:    referralService,
		chatService:        chatService,
		walletService:      walletService,
		reservationService: reservationService,
		supportService:     supportService,
	}
}

// Favorites Management
func (uh *UserHandler) GetFavorites(c *fiber.Ctx) error {
	userID := c.Locals("userID").(string)
	if userID == "" {
		return c.Status(401).JSON(fiber.Map{"error": "Unauthorized"})
	}

	favorites, err := uh.favoriteService.GetUserFavorites(userID)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to fetch favorites"})
	}

	// Transform to match frontend format
	transformedFavorites := make([]map[string]interface{}, len(favorites))
	for i, fav := range favorites {
		transformedFavorites[i] = map[string]interface{}{
			"id":           fav.Job.ID,
			"title":        fav.Job.Title,
			"description":  fav.Job.Description,
			"budgetMin":    fav.Job.BudgetMin,
			"budgetMax":    fav.Job.BudgetMax,
			"location":     fav.Job.Location,
			"isRemote":     fav.Job.IsRemote,
			"workersNeeded": fav.Job.RequiredWorkers,
			"createdAt":    fav.Job.CreatedAt,
			"thumbnail":    fav.Job.Thumbnail,
			"category": map[string]interface{}{
				"id":   fav.Job.CategoryID,
				"name": fav.Job.CategoryName,
				"slug": fav.Job.CategorySlug,
			},
			"postedBy": map[string]interface{}{
				"id":         fav.Job.User.ID,
				"firstName":  fav.Job.User.FirstName,
				"lastName":   fav.Job.User.LastName,
				"username":   fav.Job.User.Username,
				"isVerified": fav.Job.User.IsVerified,
			},
			"favoriteId":  fav.ID,
			"favoritedAt": fav.CreatedAt,
		}
	}

	return c.JSON(transformedFavorites)
}

func (uh *UserHandler) AddFavorite(c *fiber.Ctx) error {
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

	if body.JobID == "" {
		return c.Status(400).JSON(fiber.Map{"error": "Job ID is required"})
	}

	// Check if job exists
	exists, err := uh.favoriteService.JobExists(body.JobID)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to verify job"})
	}
	if !exists {
		return c.Status(404).JSON(fiber.Map{"error": "Job not found"})
	}

	// Check if already favorited
	alreadyFavorited, err := uh.favoriteService.IsFavorited(userID, body.JobID)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to check favorite status"})
	}
	if alreadyFavorited {
		return c.Status(409).JSON(fiber.Map{"error": "Job already favorited"})
	}

	// Add to favorites
	favorite, err := uh.favoriteService.AddFavorite(userID, body.JobID)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to add favorite"})
	}

	return c.JSON(fiber.Map{
		"success":  true,
		"favorite": favorite,
		"message":  "Job added to favorites",
	})
}

func (uh *UserHandler) RemoveFavorite(c *fiber.Ctx) error {
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

	if body.JobID == "" {
		return c.Status(400).JSON(fiber.Map{"error": "Job ID is required"})
	}

	err := uh.favoriteService.RemoveFavorite(userID, body.JobID)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to remove favorite"})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"message": "Job removed from favorites",
	})
}

// Referrals Management
func (uh *UserHandler) GetReferrals(c *fiber.Ctx) error {
	userID := c.Locals("userID").(string)
	if userID == "" {
		return c.Status(401).JSON(fiber.Map{"error": "Unauthorized"})
	}

	referralData, err := uh.referralService.GetUserReferrals(userID)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to fetch referrals"})
	}

	return c.JSON(referralData)
}

func (uh *UserHandler) GenerateReferralCode(c *fiber.Ctx) error {
	userID := c.Locals("userID").(string)
	if userID == "" {
		return c.Status(401).JSON(fiber.Map{"error": "Unauthorized"})
	}

	code, err := uh.referralService.GenerateReferralCode(userID)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to generate referral code"})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"code":    code,
	})
}

// Chat Money Transfer
func (uh *UserHandler) SendMoneyTransfer(c *fiber.Ctx) error {
	userID := c.Locals("userID").(string)
	if userID == "" {
		return c.Status(401).JSON(fiber.Map{"error": "Unauthorized"})
	}

	var body struct {
		ChatID     string  `json:"chatId"`
		ReceiverID string  `json:"receiverId"`
		Amount     float64 `json:"amount"`
		Message    string  `json:"message"`
	}

	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request body"})
	}

	if body.ChatID == "" || body.ReceiverID == "" || body.Amount <= 0 {
		return c.Status(400).JSON(fiber.Map{"error": "Missing required fields"})
	}

	transfer, err := uh.chatService.ProcessMoneyTransfer(userID, body.ReceiverID, body.ChatID, body.Amount, body.Message)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{
		"success":  true,
		"transfer": transfer,
	})
}

// Reservations Management
func (uh *UserHandler) GetUserReservations(c *fiber.Ctx) error {
	userID := c.Locals("userID").(string)
	if userID == "" {
		return c.Status(401).JSON(fiber.Map{"error": "Unauthorized"})
	}

	reservations, err := uh.reservationService.GetUserReservations(userID)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to fetch reservations"})
	}

	return c.JSON(fiber.Map{"reservations": reservations})
}

func (uh *UserHandler) CancelReservation(c *fiber.Ctx) error {
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

	err := uh.reservationService.CancelReservation(body.ReservationID, userID)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"message": "Reservation cancelled successfully",
	})
}

func (uh *UserHandler) CheckReservationExpiry(c *fiber.Ctx) error {
	processed, err := uh.reservationService.CleanupExpiredReservations()
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to cleanup reservations"})
	}

	return c.JSON(fiber.Map{
		"success":   true,
		"processed": processed,
	})
}

func (uh *UserHandler) CleanupReservations(c *fiber.Ctx) error {
	processed, err := uh.reservationService.CleanupExpiredReservations()
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to cleanup reservations"})
	}

	return c.JSON(fiber.Map{
		"success":   true,
		"processed": processed,
		"message":   "Reservation cleanup completed",
	})
}

// Support Tickets
func (uh *UserHandler) GetSupportTickets(c *fiber.Ctx) error {
	userID := c.Locals("userID").(string)
	if userID == "" {
		return c.Status(401).JSON(fiber.Map{"error": "Unauthorized"})
	}

	page, _ := strconv.Atoi(c.Query("page", "1"))
	limit, _ := strconv.Atoi(c.Query("limit", "20"))
	
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}
	
	offset := (page - 1) * limit

	tickets, total, err := uh.supportService.GetUserTickets(userID, limit, offset)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to fetch support tickets"})
	}

	return c.JSON(fiber.Map{
		"tickets": tickets,
		"total":   total,
		"page":    page,
		"limit":   limit,
	})
}

func (uh *UserHandler) CreateSupportTicket(c *fiber.Ctx) error {
	userID := c.Locals("userID").(string)
	if userID == "" {
		return c.Status(401).JSON(fiber.Map{"error": "Unauthorized"})
	}

	var ticketData struct {
		Subject     string `json:"subject"`
		Description string `json:"description"`
		Category    string `json:"category"`
		Priority    string `json:"priority"`
	}

	if err := c.BodyParser(&ticketData); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request body"})
	}

	if ticketData.Subject == "" || ticketData.Description == "" {
		return c.Status(400).JSON(fiber.Map{"error": "Subject and description are required"})
	}

	ticket := &models.SupportTicket{
		ID:          uuid.New().String(),
		UserID:      userID,
		Subject:     ticketData.Subject,
		Description: ticketData.Description,
		Category:    ticketData.Category,
		Priority:    ticketData.Priority,
		Status:      "open",
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	err := uh.supportService.CreateTicket(ticket)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to create support ticket"})
	}

	return c.Status(201).JSON(fiber.Map{
		"success": true,
		"ticket":  ticket,
	})
}

// Marketplace Categories
func (uh *UserHandler) GetMarketplaceCategories(c *fiber.Ctx) error {
	categories, err := uh.userService.GetMarketplaceCategories()
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to fetch categories"})
	}

	return c.JSON(fiber.Map{"categories": categories})
}
