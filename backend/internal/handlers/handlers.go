// Package handlers provides HTTP request handlers
package handlers

import (
	"net/http"
	"time"

	"catetin/backend/internal/db"

	"github.com/labstack/echo/v4"
)

// Handler holds dependencies for HTTP handlers
type Handler struct {
	queries *db.Queries
}

// New creates a new Handler with the given dependencies
func New(queries *db.Queries) *Handler {
	return &Handler{
		queries: queries,
	}
}

// Health returns the health status of the API
func (h *Handler) Health(c echo.Context) error {
	return c.JSON(http.StatusOK, map[string]interface{}{
		"status": "ok",
		"time":   time.Now().Format(time.RFC3339),
	})
}

// ListEntries returns all journal entries for the authenticated user
func (h *Handler) ListEntries(c echo.Context) error {
	// TODO: Implement after database setup
	return c.JSON(http.StatusOK, map[string]interface{}{
		"entries": []interface{}{},
		"message": "Not yet implemented",
	})
}

// CreateEntry creates a new journal entry
func (h *Handler) CreateEntry(c echo.Context) error {
	// TODO: Implement after database setup
	return c.JSON(http.StatusCreated, map[string]interface{}{
		"message": "Not yet implemented",
	})
}

// GetEntry returns a single journal entry by ID
func (h *Handler) GetEntry(c echo.Context) error {
	// TODO: Implement after database setup
	return c.JSON(http.StatusOK, map[string]interface{}{
		"message": "Not yet implemented",
	})
}

// UpdateEntry updates a journal entry
func (h *Handler) UpdateEntry(c echo.Context) error {
	// TODO: Implement after database setup
	return c.JSON(http.StatusOK, map[string]interface{}{
		"message": "Not yet implemented",
	})
}

// DeleteEntry deletes a journal entry
func (h *Handler) DeleteEntry(c echo.Context) error {
	// TODO: Implement after database setup
	return c.JSON(http.StatusNoContent, nil)
}
