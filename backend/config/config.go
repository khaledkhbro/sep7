package config

import (
	"os"
	"strings"
)

type Config struct {
	DatabaseURL    string
	JWTSecret      string
	SupabaseURL    string
	SupabaseKey    string
	CronSecret     string
	AllowedOrigins string
	Environment    string
	RedisURL       string
	RedisPassword  string
	RedisDB        int
}

func New() *Config {
	return &Config{
		DatabaseURL:    getEnv("DATABASE_URL", "postgres://localhost/microjob_db?sslmode=disable"),
		JWTSecret:      getEnv("JWT_SECRET", "your-secret-key"),
		SupabaseURL:    getEnv("NEXT_PUBLIC_SUPABASE_URL", ""),
		SupabaseKey:    getEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", ""),
		CronSecret:     getEnv("CRON_SECRET", "test-secret"),
		AllowedOrigins: getEnv("ALLOWED_ORIGINS", "http://localhost:3000,https://localhost:3000"),
		Environment:    getEnv("NODE_ENV", "development"),
		RedisURL:       getEnv("REDIS_URL", "localhost:6379"),
		RedisPassword:  getEnv("REDIS_PASSWORD", ""),
		RedisDB:        getEnvInt("REDIS_DB", 0),
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getEnvInt(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		if intValue := parseInt(value); intValue != -1 {
			return intValue
		}
	}
	return defaultValue
}

func parseInt(s string) int {
	switch s {
	case "0":
		return 0
	case "1":
		return 1
	case "2":
		return 2
	default:
		return -1
	}
}

func (c *Config) IsDevelopment() bool {
	return strings.ToLower(c.Environment) == "development"
}

func (c *Config) IsProduction() bool {
	return strings.ToLower(c.Environment) == "production"
}
