package middleware

import (
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"

	"microjob-backend/models"
)

type Claims struct {
	UserID   string `json:"user_id"`
	Email    string `json:"email"`
	UserType string `json:"user_type"`
	jwt.RegisteredClaims
}

func AuthMiddleware(jwtSecret string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		authHeader := c.Get("Authorization")
		if authHeader == "" {
			return c.Status(401).JSON(fiber.Map{
				"error": "Authorization header required",
			})
		}

		tokenString := strings.TrimPrefix(authHeader, "Bearer ")
		if tokenString == authHeader {
			return c.Status(401).JSON(fiber.Map{
				"error": "Invalid authorization format",
			})
		}

		token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
			return []byte(jwtSecret), nil
		})

		if err != nil || !token.Valid {
			return c.Status(401).JSON(fiber.Map{
				"error": "Invalid token",
			})
		}

		claims, ok := token.Claims.(*Claims)
		if !ok {
			return c.Status(401).JSON(fiber.Map{
				"error": "Invalid token claims",
			})
		}

		// Store user info in context
		c.Locals("user", &models.AuthUser{
			ID:       claims.UserID,
			Email:    claims.Email,
			UserType: claims.UserType,
		})

		return c.Next()
	}
}

func AdminMiddleware() fiber.Handler {
	return func(c *fiber.Ctx) error {
		user := c.Locals("user").(*models.AuthUser)
		if user.UserType != "admin" {
			return c.Status(403).JSON(fiber.Map{
				"error": "Admin access required",
			})
		}
		return c.Next()
	}
}

func CronAuthMiddleware(cronSecret string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		authHeader := c.Get("Authorization")
		expectedAuth := "Bearer " + cronSecret

		if authHeader != expectedAuth {
			return c.Status(401).JSON(fiber.Map{
				"error": "Unauthorized",
			})
		}

		return c.Next()
	}
}

func GenerateJWT(user *models.User, jwtSecret string) (string, error) {
	claims := &Claims{
		UserID:   user.ID,
		Email:    user.Email,
		UserType: user.UserType,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(jwtSecret))
}

// Optional middleware for endpoints that can work with or without auth
func OptionalAuthMiddleware(jwtSecret string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		authHeader := c.Get("Authorization")
		if authHeader == "" {
			// No auth header, continue without user context
			return c.Next()
		}

		tokenString := strings.TrimPrefix(authHeader, "Bearer ")
		if tokenString == authHeader {
			// Invalid format, continue without user context
			return c.Next()
		}

		token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
			return []byte(jwtSecret), nil
		})

		if err != nil || !token.Valid {
			// Invalid token, continue without user context
			return c.Next()
		}

		claims, ok := token.Claims.(*Claims)
		if !ok {
			// Invalid claims, continue without user context
			return c.Next()
		}

		// Store user info in context
		c.Locals("user", &models.AuthUser{
			ID:       claims.UserID,
			Email:    claims.Email,
			UserType: claims.UserType,
		})

		return c.Next()
	}
}
