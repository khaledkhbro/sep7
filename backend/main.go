package main

import (
	"context"
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"
	"github.com/joho/godotenv"

	"microjob-backend/config"
	"microjob-backend/database"
	"microjob-backend/cache"
	"microjob-backend/middleware"
	"microjob-backend/routes"
	"microjob-backend/cron"
	"microjob-backend/services"
)

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found")
	}

	// Initialize configuration
	cfg := config.New()

	// Initialize database
	db, err := database.Connect(cfg.DatabaseURL)
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	redisClient, err := cache.NewRedisClient(cfg.RedisURL, cfg.RedisPassword, cfg.RedisDB)
	if err != nil {
		log.Fatal("Failed to connect to Redis:", err)
	}

	reservationService := services.NewReservationService(db)
	workProofService := services.NewWorkProofService(db)
	walletService := services.NewWalletService(db)
	adminService := services.NewAdminService(db)
	cacheService := services.NewCacheService(redisClient)

	cronScheduler := cron.NewCronScheduler(reservationService, workProofService, walletService, adminService)
	cronScheduler.Start()

	// Create Fiber app
	app := fiber.New(fiber.Config{
		ErrorHandler: middleware.ErrorHandler,
		BodyLimit:    10 * 1024 * 1024, // 10MB
	})

	// Global middleware
	app.Use(recover.New())
	app.Use(logger.New())
	app.Use(cors.New(cors.Config{
		AllowOrigins:     cfg.AllowedOrigins,
		AllowMethods:     "GET,POST,PUT,DELETE,OPTIONS",
		AllowHeaders:     "Origin,Content-Type,Accept,Authorization",
		AllowCredentials: true,
	}))

	routes.Setup(app, db, cfg, redisClient, cacheService)

	c := make(chan os.Signal, 1)
	signal.Notify(c, os.Interrupt, syscall.SIGTERM)

	go func() {
		<-c
		log.Println("Gracefully shutting down...")
		cronScheduler.Stop()
		
		if err := redisClient.Close(); err != nil {
			log.Printf("Error closing Redis connection: %v", err)
		}
		
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()
		
		if err := app.ShutdownWithContext(ctx); err != nil {
			log.Printf("Server forced to shutdown: %v", err)
		}
		
		log.Println("Server exiting")
		os.Exit(0)
	}()

	// Start server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server starting on port %s", port)
	log.Fatal(app.Listen(":" + port))
}
