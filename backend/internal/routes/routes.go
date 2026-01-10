// Package routes configures HTTP routes for the application
package routes

import (
	"catetin/backend/internal/handlers"
	appMiddleware "catetin/backend/internal/middleware"

	"github.com/labstack/echo/v4"
)

// Register sets up all routes for the application
func Register(e *echo.Echo, h *handlers.Handler) {
	// Health check (public)
	e.GET("/api/health", h.Health)

	// Protected routes (require authentication)
	api := e.Group("/api")
	api.Use(appMiddleware.ClerkAuth())

	// Journal entries
	api.GET("/entries", h.ListEntries)
	api.POST("/entries", h.CreateEntry)
	api.GET("/entries/:id", h.GetEntry)
	api.PUT("/entries/:id", h.UpdateEntry)
	api.DELETE("/entries/:id", h.DeleteEntry)
}
