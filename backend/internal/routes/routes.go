// Package routes configures HTTP routes for the application
package routes

import (
	"catetin/backend/internal/handlers"
	appMiddleware "catetin/backend/internal/middleware"

	"github.com/labstack/echo/v4"
)

// Register sets up all routes for the application
func Register(e *echo.Echo, h *handlers.Handler, wh *handlers.WebhookHandler) {
	// Health check (public)
	e.GET("/api/health", h.Health)

	// Webhooks (public, no auth - validated by token)
	if wh != nil {
		e.POST("/api/webhooks/trakteer", wh.TrakteerWebhook)
	}

	// Protected routes (require authentication)
	api := e.Group("/api")
	api.Use(appMiddleware.ClerkAuth())

	// User stats
	api.GET("/stats", h.GetUserStats)

	// Subscription
	api.GET("/subscription", h.GetSubscription)

	// Sessions
	api.POST("/sessions", h.CreateSession)
	api.POST("/sessions/start", h.StartSession)           // Creates session with AI opening
	api.GET("/sessions/today", h.GetOrCreateTodaySession) // Get or create today's session
	api.GET("/sessions", h.ListSessions)
	api.GET("/sessions/:id", h.GetSession)
	api.PUT("/sessions/:id", h.UpdateSession)

	// Messages
	api.POST("/sessions/:id/messages", h.CreateMessage)
	api.GET("/sessions/:id/messages", h.ListMessages)

	// AI Response
	api.POST("/sessions/:id/respond", h.Respond)

	// Weekly Summaries (Risalah Mingguan - premium only)
	api.GET("/summaries", h.ListSummaries)
	api.GET("/summaries/latest", h.GetLatestSummary)
}
