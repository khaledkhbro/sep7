package handlers

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"regexp"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"

	"microjob-backend/config"
	"microjob-backend/database"
	"microjob-backend/middleware"
	"microjob-backend/models"
)

type AuthHandler struct {
	db  *database.DB
	cfg *config.Config
}

func NewAuthHandler(db *database.DB, cfg *config.Config) *AuthHandler {
	return &AuthHandler{db: db, cfg: cfg}
}

type LoginResponse struct {
	Success bool         `json:"success"`
	User    *models.User `json:"user"`
	Token   string       `json:"token"`
	Message string       `json:"message"`
}

type RegisterResponse struct {
	Success bool         `json:"success"`
	User    *models.User `json:"user"`
	Token   string       `json:"token"`
	Message string       `json:"message"`
}

func (h *AuthHandler) Login(c *fiber.Ctx) error {
	var req models.LoginRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	// Validate input
	if req.Email == "" || req.Password == "" {
		return c.Status(400).JSON(fiber.Map{
			"error": "Email and password are required",
		})
	}

	if !isValidEmail(req.Email) {
		return c.Status(400).JSON(fiber.Map{
			"error": "Invalid email format",
		})
	}

	// Get user from database
	user, err := h.db.GetUserByEmail(req.Email)
	if err != nil {
		return c.Status(401).JSON(fiber.Map{
			"error": "Invalid email or password",
		})
	}

	// Check if user is suspended
	if user.UserType == "suspended" {
		return c.Status(403).JSON(fiber.Map{
			"error": "Your account has been suspended",
		})
	}

	if !user.IsActive {
		return c.Status(403).JSON(fiber.Map{
			"error": "Your account has been deactivated",
		})
	}

	// Verify password
	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		return c.Status(401).JSON(fiber.Map{
			"error": "Invalid email or password",
		})
	}

	// Generate JWT token
	token, err := middleware.GenerateJWT(user, h.cfg.JWTSecret)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to generate token",
		})
	}

	// Create wallet if it doesn't exist
	_, err = h.db.GetWalletByUserID(user.ID)
	if err != nil {
		wallet := &models.Wallet{
			ID:             uuid.New().String(),
			UserID:         user.ID,
			Balance:        0,
			PendingBalance: 0,
			TotalEarned:    0,
			TotalSpent:     0,
		}
		h.db.CreateWallet(wallet)
	}

	// Remove password hash from response
	user.PasswordHash = ""

	return c.JSON(LoginResponse{
		Success: true,
		User:    user,
		Token:   token,
		Message: "Login successful",
	})
}

func (h *AuthHandler) Register(c *fiber.Ctx) error {
	var req models.RegisterRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	// Validate input
	if err := h.validateRegistration(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	// Check if user already exists
	existingUser, _ := h.db.GetUserByEmail(req.Email)
	if existingUser != nil {
		return c.Status(409).JSON(fiber.Map{
			"error": "An account with this email already exists",
		})
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to process password",
		})
	}

	// Generate username if not provided
	username := req.Email
	if strings.Contains(username, "@") {
		username = strings.Split(username, "@")[0]
	}
	username = generateUniqueUsername(h.db, username)

	// Create user
	user := &models.User{
		ID:           uuid.New().String(),
		Email:        req.Email,
		PasswordHash: string(hashedPassword),
		FirstName:    req.FirstName,
		LastName:     req.LastName,
		Username:     username,
		UserType:     req.UserType,
		IsVerified:   false,
		IsActive:     true,
		Skills:       models.JSONArray{},
		Rating:       0.0,
		TotalReviews: 0,
	}

	if err := h.db.CreateUser(user); err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to create user account",
		})
	}

	// Create wallet for new user
	wallet := &models.Wallet{
		ID:             uuid.New().String(),
		UserID:         user.ID,
		Balance:        0,
		PendingBalance: 0,
		TotalEarned:    0,
		TotalSpent:     0,
	}
	h.db.CreateWallet(wallet)

	// Generate JWT token
	token, err := middleware.GenerateJWT(user, h.cfg.JWTSecret)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to generate token",
		})
	}

	// Remove password hash from response
	user.PasswordHash = ""

	return c.Status(201).JSON(RegisterResponse{
		Success: true,
		User:    user,
		Token:   token,
		Message: "Account created successfully",
	})
}

func (h *AuthHandler) GetReferrals(c *fiber.Ctx) error {
	user := c.Locals("user").(*models.AuthUser)

	// Get user's referral code
	var referralCode string
	err := h.db.QueryRow("SELECT code FROM referral_codes WHERE user_id = $1", user.ID).Scan(&referralCode)
	if err != nil {
		referralCode = ""
	}

	// Get referrals
	rows, err := h.db.Query(`
		SELECT r.id, r.status, r.created_at, u.id, u.first_name, u.last_name, u.email, u.location, u.created_at
		FROM referrals r
		JOIN users u ON r.referred_id = u.id
		WHERE r.referrer_id = $1
		ORDER BY r.created_at DESC`, user.ID)

	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to fetch referrals",
		})
	}
	defer rows.Close()

	var referrals []map[string]interface{}
	totalReferrals := 0
	completedReferrals := 0
	pendingReferrals := 0

	for rows.Next() {
		var referral struct {
			ID        string
			Status    string
			CreatedAt time.Time
			User      struct {
				ID        string
				FirstName string
				LastName  string
				Email     string
				Location  *string
				CreatedAt time.Time
			}
		}

		err := rows.Scan(
			&referral.ID, &referral.Status, &referral.CreatedAt,
			&referral.User.ID, &referral.User.FirstName, &referral.User.LastName,
			&referral.User.Email, &referral.User.Location, &referral.User.CreatedAt,
		)
		if err != nil {
			continue
		}

		totalReferrals++
		if referral.Status == "completed" {
			completedReferrals++
		} else {
			pendingReferrals++
		}

		location := "Not specified"
		if referral.User.Location != nil {
			location = *referral.User.Location
		}

		referralType := "Regular"
		if referral.Status == "completed" {
			referralType = "VIP"
		}

		referrals = append(referrals, map[string]interface{}{
			"id":          referral.ID,
			"userId":      referral.User.ID,
			"fullName":    fmt.Sprintf("%s %s", referral.User.FirstName, referral.User.LastName),
			"email":       referral.User.Email,
			"country":     location,
			"joiningDate": referral.User.CreatedAt,
			"status":      referral.Status,
			"type":        referralType,
		})
	}

	return c.JSON(fiber.Map{
		"referralCode": referralCode,
		"statistics": fiber.Map{
			"total":     totalReferrals,
			"completed": completedReferrals,
			"pending":   pendingReferrals,
			"vip":       completedReferrals,
		},
		"referrals": referrals,
	})
}

func (h *AuthHandler) GenerateReferralCode(c *fiber.Ctx) error {
	user := c.Locals("user").(*models.AuthUser)

	// Check if user already has a referral code
	var existingCode string
	err := h.db.QueryRow("SELECT code FROM referral_codes WHERE user_id = $1", user.ID).Scan(&existingCode)
	if err == nil {
		return c.JSON(fiber.Map{
			"code": existingCode,
		})
	}

	// Generate new referral code
	code := generateReferralCode()
	attempts := 0
	maxAttempts := 10

	// Ensure code is unique
	for attempts < maxAttempts {
		var existing string
		err := h.db.QueryRow("SELECT code FROM referral_codes WHERE code = $1", code).Scan(&existing)
		if err != nil {
			// Code is unique
			break
		}
		code = generateReferralCode()
		attempts++
	}

	if attempts >= maxAttempts {
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to generate unique referral code",
		})
	}

	// Insert new referral code
	_, err = h.db.Exec(`
		INSERT INTO referral_codes (id, user_id, code, uses_count, max_uses, is_active)
		VALUES ($1, $2, $3, 0, 100, true)`,
		uuid.New().String(), user.ID, code)

	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to create referral code",
		})
	}

	return c.JSON(fiber.Map{
		"code": code,
	})
}

// Helper functions
func (h *AuthHandler) validateRegistration(req *models.RegisterRequest) error {
	if req.Email == "" {
		return fmt.Errorf("email is required")
	}

	if !isValidEmail(req.Email) {
		return fmt.Errorf("please enter a valid email address")
	}

	if len(req.Password) < 8 {
		return fmt.Errorf("password must be at least 8 characters long")
	}

	if !isValidPassword(req.Password) {
		return fmt.Errorf("password must contain at least one uppercase letter, one lowercase letter, and one number")
	}

	if req.FirstName == "" {
		return fmt.Errorf("first name is required")
	}

	if req.LastName == "" {
		return fmt.Errorf("last name is required")
	}

	if req.UserType != "user" && req.UserType != "admin" {
		return fmt.Errorf("invalid user type")
	}

	return nil
}

func isValidEmail(email string) bool {
	emailRegex := regexp.MustCompile(`^[^\s@]+@[^\s@]+\.[^\s@]+$`)
	return emailRegex.Test(email)
}

func isValidPassword(password string) bool {
	// At least 8 characters, one uppercase, one lowercase, one number
	passwordRegex := regexp.MustCompile(`^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$`)
	return passwordRegex.Test(password)
}

func generateUniqueUsername(db *database.DB, baseUsername string) string {
	username := baseUsername
	counter := 1

	for {
		var existing string
		err := db.QueryRow("SELECT username FROM users WHERE username = $1", username).Scan(&existing)
		if err != nil {
			// Username is available
			break
		}
		username = fmt.Sprintf("%s%d", baseUsername, counter)
		counter++
	}

	return username
}

func generateReferralCode() string {
	const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
	bytes := make([]byte, 4)
	rand.Read(bytes)
	
	result := make([]byte, 8)
	for i := 0; i < 8; i++ {
		result[i] = chars[bytes[i%4]%byte(len(chars))]
	}
	
	return string(result)
}
