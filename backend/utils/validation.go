package utils

import (
	"regexp"
	"strings"
)

// Email validation
func IsValidEmail(email string) bool {
	emailRegex := regexp.MustCompile(`^[^\s@]+@[^\s@]+\.[^\s@]+$`)
	return emailRegex.Test(email)
}

// Password validation - at least 8 characters, one uppercase, one lowercase, one number
func IsValidPassword(password string) bool {
	if len(password) < 8 {
		return false
	}
	
	hasUpper := regexp.MustCompile(`[A-Z]`).MatchString(password)
	hasLower := regexp.MustCompile(`[a-z]`).MatchString(password)
	hasNumber := regexp.MustCompile(`\d`).MatchString(password)
	
	return hasUpper && hasLower && hasNumber
}

// Username validation - alphanumeric and underscores only, 3-30 characters
func IsValidUsername(username string) bool {
	if len(username) < 3 || len(username) > 30 {
		return false
	}
	
	usernameRegex := regexp.MustCompile(`^[a-zA-Z0-9_]+$`)
	return usernameRegex.Test(username)
}

// Sanitize input strings
func SanitizeString(input string) string {
	// Remove leading/trailing whitespace
	input = strings.TrimSpace(input)
	
	// Remove null bytes
	input = strings.ReplaceAll(input, "\x00", "")
	
	return input
}

// Validate required fields
func ValidateRequired(fields map[string]string) []string {
	var errors []string
	
	for fieldName, value := range fields {
		if strings.TrimSpace(value) == "" {
			errors = append(errors, fieldName+" is required")
		}
	}
	
	return errors
}

// Check if string contains only allowed characters
func ContainsOnlyAllowed(input string, allowedChars string) bool {
	for _, char := range input {
		if !strings.ContainsRune(allowedChars, char) {
			return false
		}
	}
	return true
}

// Validate string length
func ValidateLength(input string, min, max int) bool {
	length := len(input)
	return length >= min && length <= max
}
