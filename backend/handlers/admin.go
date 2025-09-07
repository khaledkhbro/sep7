package handlers

import (
	"encoding/json"
	"strconv"
	"time"

	"github.com/gofiber/fiber/v2"
	"microjob-backend/models"
	"microjob-backend/services"
)

type AdminHandler struct {
	adminService *services.AdminService
}

func NewAdminHandler(adminService *services.AdminService) *AdminHandler {
	return &AdminHandler{adminService: adminService}
}

// Platform Fee Settings
func (ah *AdminHandler) GetPlatformFeeSettings(c *fiber.Ctx) error {
	settings, err := ah.adminService.GetPlatformFeeSettings()
	if err != nil {
		// Return default settings on error
		defaultSettings := &models.PlatformFeeSettings{
			ID:         "default",
			Enabled:    true,
			Percentage: 5.0,
			FixedFee:   0.0,
			MinimumFee: 0.0,
			MaximumFee: 0,
			CreatedAt:  time.Now(),
			UpdatedAt:  time.Now(),
		}
		
		// Map to frontend format
		response := map[string]interface{}{
			"settings": map[string]interface{}{
				"id":           defaultSettings.ID,
				"enabled":      defaultSettings.Enabled,
				"percentage":   defaultSettings.Percentage,
				"fixed_fee":    defaultSettings.FixedFee,
				"minimum_fee":  defaultSettings.MinimumFee,
				"maximum_fee":  defaultSettings.MaximumFee,
				"isActive":     defaultSettings.Enabled,
				"feePercentage": defaultSettings.Percentage,
				"feeFixed":     defaultSettings.FixedFee,
				"minimumFee":   defaultSettings.MinimumFee,
				"maximumFee":   defaultSettings.MaximumFee,
				"created_at":   defaultSettings.CreatedAt,
				"updated_at":   defaultSettings.UpdatedAt,
			},
		}
		return c.JSON(response)
	}

	// Map to frontend format
	response := map[string]interface{}{
		"settings": map[string]interface{}{
			"id":           settings.ID,
			"enabled":      settings.Enabled,
			"percentage":   settings.Percentage,
			"fixed_fee":    settings.FixedFee,
			"minimum_fee":  settings.MinimumFee,
			"maximum_fee":  settings.MaximumFee,
			"isActive":     settings.Enabled,
			"feePercentage": settings.Percentage,
			"feeFixed":     settings.FixedFee,
			"minimumFee":   settings.MinimumFee,
			"maximumFee":   settings.MaximumFee,
			"created_at":   settings.CreatedAt,
			"updated_at":   settings.UpdatedAt,
		},
	}

	return c.JSON(response)
}

func (ah *AdminHandler) UpdatePlatformFeeSettings(c *fiber.Ctx) error {
	var body map[string]interface{}
	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request body"})
	}

	updateData := &models.PlatformFeeSettings{}
	
	if isActive, ok := body["isActive"].(bool); ok {
		updateData.Enabled = isActive
	} else {
		updateData.Enabled = true
	}
	
	if feePercentage, ok := body["feePercentage"].(float64); ok {
		updateData.Percentage = feePercentage
	} else {
		updateData.Percentage = 5.0
	}
	
	if feeFixed, ok := body["feeFixed"].(float64); ok {
		updateData.FixedFee = feeFixed
	} else {
		updateData.FixedFee = 0.0
	}
	
	if minimumFee, ok := body["minimumFee"].(float64); ok {
		updateData.MinimumFee = minimumFee
	} else {
		updateData.MinimumFee = 0.0
	}
	
	if maximumFee, ok := body["maximumFee"].(float64); ok {
		updateData.MaximumFee = maximumFee
	} else {
		updateData.MaximumFee = 0
	}

	settings, err := ah.adminService.UpdatePlatformFeeSettings(updateData)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to update platform fee settings"})
	}

	// Map to frontend format
	response := map[string]interface{}{
		"settings": map[string]interface{}{
			"id":           settings.ID,
			"enabled":      settings.Enabled,
			"percentage":   settings.Percentage,
			"fixed_fee":    settings.FixedFee,
			"minimum_fee":  settings.MinimumFee,
			"maximum_fee":  settings.MaximumFee,
			"isActive":     settings.Enabled,
			"feePercentage": settings.Percentage,
			"feeFixed":     settings.FixedFee,
			"minimumFee":   settings.MinimumFee,
			"maximumFee":   settings.MaximumFee,
			"created_at":   settings.CreatedAt,
			"updated_at":   settings.UpdatedAt,
		},
	}

	return c.JSON(response)
}

// Revision Settings
func (ah *AdminHandler) GetRevisionSettings(c *fiber.Ctx) error {
	settings, err := ah.adminService.GetRevisionSettings()
	if err != nil {
		// Return default settings
		defaultSettings := map[string]interface{}{
			"maxRevisionRequests":         2,
			"revisionRequestTimeoutValue": 24,
			"revisionRequestTimeoutUnit":  "hours",
			"rejectionResponseTimeoutValue": 24,
			"rejectionResponseTimeoutUnit":  "hours",
			"enableAutomaticRefunds":      true,
			"refundOnRevisionTimeout":     true,
			"refundOnRejectionTimeout":    true,
			"enableRevisionWarnings":      true,
			"revisionPenaltyEnabled":      false,
			"revisionPenaltyAmount":       0,
		}
		return c.JSON(defaultSettings)
	}

	return c.JSON(settings)
}

func (ah *AdminHandler) UpdateRevisionSettings(c *fiber.Ctx) error {
	// Check admin authorization
	userID := c.Locals("userID").(string)
	userType := c.Locals("userType").(string)
	
	if userType != "admin" {
		return c.Status(403).JSON(fiber.Map{"error": "Admin access required"})
	}

	var settings map[string]interface{}
	if err := c.BodyParser(&settings); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid settings data"})
	}

	// Add timestamp
	settings["updated_at"] = time.Now().Format(time.RFC3339)

	err := ah.adminService.UpdateRevisionSettings(settings)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to save settings"})
	}

	return c.JSON(fiber.Map{"success": true})
}

// Commission Settings
func (ah *AdminHandler) GetCommissionSettings(c *fiber.Ctx) error {
	// Check admin authorization
	userType := c.Locals("userType").(string)
	if userType != "admin" {
		return c.Status(401).JSON(fiber.Map{"error": "Unauthorized"})
	}

	feeSettings, err := ah.adminService.GetAllFeeSettings()
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to fetch commission settings"})
	}

	return c.JSON(fiber.Map{"feeSettings": feeSettings})
}

func (ah *AdminHandler) UpdateCommissionSettings(c *fiber.Ctx) error {
	// Check admin authorization
	userType := c.Locals("userType").(string)
	if userType != "admin" {
		return c.Status(401).JSON(fiber.Map{"error": "Unauthorized"})
	}

	var body struct {
		FeeType  string                 `json:"feeType"`
		Settings map[string]interface{} `json:"settings"`
	}

	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request body"})
	}

	if body.FeeType == "" || body.Settings == nil {
		return c.Status(400).JSON(fiber.Map{"error": "Missing required fields"})
	}

	feeSetting := &models.AdminFeeSetting{
		FeeType:    body.FeeType,
		UpdatedAt:  time.Now(),
	}

	if feePercentage, ok := body.Settings["feePercentage"].(float64); ok {
		feeSetting.FeePercentage = feePercentage
	}
	if feeFixed, ok := body.Settings["feeFixed"].(float64); ok {
		feeSetting.FeeFixed = feeFixed
	}
	if minimumFee, ok := body.Settings["minimumFee"].(float64); ok {
		feeSetting.MinimumFee = minimumFee
	}
	if maximumFee, ok := body.Settings["maximumFee"].(float64); ok {
		feeSetting.MaximumFee = &maximumFee
	}
	if isActive, ok := body.Settings["isActive"].(bool); ok {
		feeSetting.IsActive = isActive
	}

	data, err := ah.adminService.UpsertFeeSetting(feeSetting)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to update commission settings"})
	}

	return c.JSON(fiber.Map{"success": true, "data": data})
}

// Approval Settings
func (ah *AdminHandler) GetApprovalSettings(c *fiber.Ctx) error {
	settings, err := ah.adminService.GetApprovalSettings()
	if err != nil {
		// Return default settings
		defaultSettings := map[string]interface{}{
			"requireApprovalForJobs":     false,
			"autoApproveVerifiedUsers":   true,
			"approvalTimeoutHours":       24,
			"enableInstantApproval":      true,
			"maxPendingJobs":            10,
		}
		return c.JSON(defaultSettings)
	}

	return c.JSON(settings)
}

func (ah *AdminHandler) UpdateApprovalSettings(c *fiber.Ctx) error {
	// Check admin authorization
	userType := c.Locals("userType").(string)
	if userType != "admin" {
		return c.Status(403).JSON(fiber.Map{"error": "Admin access required"})
	}

	var settings map[string]interface{}
	if err := c.BodyParser(&settings); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid settings data"})
	}

	settings["updated_at"] = time.Now().Format(time.RFC3339)

	err := ah.adminService.UpdateApprovalSettings(settings)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to save settings"})
	}

	return c.JSON(fiber.Map{"success": true})
}

// Feature Settings
func (ah *AdminHandler) GetFeatureSettings(c *fiber.Ctx) error {
	settings, err := ah.adminService.GetFeatureSettings()
	if err != nil {
		// Return default settings
		defaultSettings := map[string]interface{}{
			"enableJobReservations":      true,
			"enableInstantPayments":      true,
			"enableWorkProofRevisions":   true,
			"enableChatMoneyTransfers":   true,
			"enableReferralSystem":       true,
			"enableFavorites":           true,
			"maxJobsPerUser":            50,
			"maxApplicationsPerJob":     100,
		}
		return c.JSON(defaultSettings)
	}

	return c.JSON(settings)
}

func (ah *AdminHandler) UpdateFeatureSettings(c *fiber.Ctx) error {
	// Check admin authorization
	userType := c.Locals("userType").(string)
	if userType != "admin" {
		return c.Status(403).JSON(fiber.Map{"error": "Admin access required"})
	}

	var settings map[string]interface{}
	if err := c.BodyParser(&settings); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid settings data"})
	}

	settings["updated_at"] = time.Now().Format(time.RFC3339)

	err := ah.adminService.UpdateFeatureSettings(settings)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to save settings"})
	}

	return c.JSON(fiber.Map{"success": true})
}

// Reservation Settings
func (ah *AdminHandler) GetReservationSettings(c *fiber.Ctx) error {
	settings, err := ah.adminService.GetReservationSettings()
	if err != nil {
		// Return default settings
		defaultSettings := map[string]interface{}{
			"enableReservations":         true,
			"reservationTimeoutMinutes":  30,
			"maxReservationsPerUser":     5,
			"requirePaymentForReservation": true,
		}
		return c.JSON(defaultSettings)
	}

	return c.JSON(settings)
}

func (ah *AdminHandler) UpdateReservationSettings(c *fiber.Ctx) error {
	// Check admin authorization
	userType := c.Locals("userType").(string)
	if userType != "admin" {
		return c.Status(403).JSON(fiber.Map{"error": "Admin access required"})
	}

	var settings map[string]interface{}
	if err := c.BodyParser(&settings); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid settings data"})
	}

	settings["updated_at"] = time.Now().Format(time.RFC3339)

	err := ah.adminService.UpdateReservationSettings(settings)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to save settings"})
	}

	return c.JSON(fiber.Map{"success": true})
}

// Support Pricing
func (ah *AdminHandler) GetSupportPricing(c *fiber.Ctx) error {
	pricing, err := ah.adminService.GetSupportPricing()
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to fetch support pricing"})
	}

	return c.JSON(fiber.Map{"pricing": pricing})
}

func (ah *AdminHandler) UpdateSupportPricing(c *fiber.Ctx) error {
	// Check admin authorization
	userType := c.Locals("userType").(string)
	if userType != "admin" {
		return c.Status(403).JSON(fiber.Map{"error": "Admin access required"})
	}

	var pricing []models.SupportPricing
	if err := c.BodyParser(&pricing); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid pricing data"})
	}

	err := ah.adminService.UpdateSupportPricing(pricing)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to update support pricing"})
	}

	return c.JSON(fiber.Map{"success": true})
}

// Reservation Violations
func (ah *AdminHandler) GetReservationViolations(c *fiber.Ctx) error {
	page, _ := strconv.Atoi(c.Query("page", "1"))
	limit, _ := strconv.Atoi(c.Query("limit", "20"))
	
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}
	
	offset := (page - 1) * limit

	violations, total, err := ah.adminService.GetReservationViolations(limit, offset)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to fetch reservation violations"})
	}

	return c.JSON(fiber.Map{
		"violations": violations,
		"total":      total,
		"page":       page,
		"limit":      limit,
	})
}
