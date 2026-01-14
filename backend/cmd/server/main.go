package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"time"

	"catetin/backend/internal/ai"
	"catetin/backend/internal/config"
	"catetin/backend/internal/db"
	"catetin/backend/internal/handlers"
	appMiddleware "catetin/backend/internal/middleware"
	"catetin/backend/internal/routes"
	"catetin/backend/internal/services"

	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
)

func main() {
	// Load configuration
	cfg := config.Load()

	// Initialize Clerk SDK
	if cfg.ClerkSecretKey != "" {
		appMiddleware.InitClerk(cfg.ClerkSecretKey)
	} else {
		log.Println("WARNING: CLERK_SECRET_KEY not set, authentication will not work")
	}

	// Initialize database connection
	ctx := context.Background()
	pool, err := db.NewPool(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Printf("WARNING: Failed to connect to database: %v", err)
		// Continue without database for now
	} else {
		defer pool.Close()
		log.Println("Connected to database successfully")
	}

	// Create SQLC queries instance
	var queries *db.Queries
	if pool != nil {
		queries = db.New(pool.Pool)
	}

	// Initialize AI client
	var aiClient *ai.Client
	var pujanggaService *ai.PujanggaService
	if cfg.OpenRouterAPIKey != "" {
		var err error
		aiClient, err = ai.NewClient(ctx, ai.ClientConfig{
			APIKey: cfg.OpenRouterAPIKey,
		})
		if err != nil {
			log.Printf("WARNING: Failed to initialize AI client: %v", err)
		} else {
			pujanggaService = ai.NewPujanggaService(aiClient)
			log.Println("AI client initialized successfully")
		}
	} else {
		log.Println("WARNING: OPENROUTER_API_KEY not set, AI features will not work")
	}

	// Initialize gamification service
	var gamificationService *services.GamificationService
	if queries != nil {
		gamificationService = services.NewGamificationService(queries, nil)
		log.Println("Gamification service initialized")
	}

	// Initialize leveling service
	var levelingService *services.LevelingService
	if queries != nil {
		levelingService = services.NewLevelingService(queries, nil)
		log.Println("Leveling service initialized")
	}

	// Initialize webhook processor
	var webhookProcessor *services.WebhookProcessor
	if queries != nil {
		webhookProcessor = services.NewWebhookProcessor(queries)
		log.Println("Webhook processor initialized")
	}

	// Create handler with dependencies
	h := handlers.New(queries, pujanggaService, gamificationService, levelingService, cfg.SupportEmail)

	// Create webhook handler
	var wh *handlers.WebhookHandler
	if cfg.TrakteerWebhookToken != "" {
		wh = handlers.NewWebhookHandler(webhookProcessor, cfg.TrakteerWebhookToken)
		log.Println("Trakteer webhook handler initialized")
	} else {
		log.Println("WARNING: TRAKTEER_WEBHOOK_TOKEN not set, webhook endpoint will reject all requests")
		wh = handlers.NewWebhookHandler(webhookProcessor, "") // Will reject all requests
	}

	e := echo.New()

	// Middleware
	e.Use(middleware.Logger())
	e.Use(middleware.Recover())
	e.Use(middleware.CORSWithConfig(middleware.CORSConfig{
		AllowOrigins: []string{"http://localhost:3000", "http://localhost:5173"},
		AllowMethods: []string{http.MethodGet, http.MethodPost, http.MethodPut, http.MethodDelete, http.MethodOptions, http.MethodPatch},
		AllowHeaders: []string{echo.HeaderOrigin, echo.HeaderContentType, echo.HeaderAccept, echo.HeaderAuthorization},
	}))

	// Register routes
	routes.Register(e, h, wh)

	// Get port from configuration
	port := cfg.BackendPort

	// Start server with graceful shutdown
	go func() {
		if err := e.Start(":" + port); err != nil && err != http.ErrServerClosed {
			e.Logger.Fatal("shutting down the server")
		}
	}()

	// Wait for interrupt signal to gracefully shutdown the server
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, os.Interrupt)
	<-quit

	// Graceful shutdown with 10 second timeout
	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := e.Shutdown(shutdownCtx); err != nil {
		e.Logger.Fatal(err)
	}
}
