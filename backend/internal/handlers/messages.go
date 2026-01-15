// Package handlers provides HTTP request handlers
package handlers

import (
	"errors"
	"fmt"
	"net/http"

	"catetin/backend/internal/db"
	"catetin/backend/internal/middleware"
	"catetin/backend/internal/types"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/labstack/echo/v4"
)

// CreateMessage adds a message to a session
func (h *Handler) CreateMessage(c echo.Context) error {
	userID, err := middleware.RequireUserID(c)
	if err != nil {
		return err
	}

	sessionID := c.Param("id")
	if sessionID == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "session id is required")
	}

	// Parse session UUID
	var sessionUUID pgtype.UUID
	if err := sessionUUID.Scan(sessionID); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid session id")
	}

	// Verify session belongs to user
	_, err = h.queries.GetSessionByID(c.Request().Context(), db.GetSessionByIDParams{
		ID:     sessionUUID,
		UserID: userID,
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return echo.NewHTTPError(http.StatusNotFound, "session not found")
		}
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to verify session")
	}

	// Parse request body
	var req types.CreateMessageRequest
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request body")
	}

	// Validate role
	if req.Role != "user" && req.Role != "assistant" {
		return echo.NewHTTPError(http.StatusBadRequest, "role must be 'user' or 'assistant'")
	}

	// Validate content
	if req.Content == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "content is required")
	}

	// Validate content length
	if len([]rune(req.Content)) > MaxMessageLength {
		return echo.NewHTTPError(http.StatusBadRequest,
			fmt.Sprintf("Pesan terlalu panjang. Maksimal %d karakter.", MaxMessageLength))
	}

	// Create message
	message, err := h.queries.CreateMessage(c.Request().Context(), db.CreateMessageParams{
		SessionID: sessionUUID,
		Role:      req.Role,
		Content:   req.Content,
	})
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to create message")
	}

	// Increment session message count
	_, err = h.queries.IncrementSessionMessages(c.Request().Context(), sessionUUID)
	if err != nil {
		// Log but don't fail - message was created
		c.Logger().Errorf("failed to increment session messages: %v", err)
	}

	return c.JSON(http.StatusCreated, message)
}

// ListMessages returns all messages for a session
func (h *Handler) ListMessages(c echo.Context) error {
	userID, err := middleware.RequireUserID(c)
	if err != nil {
		return err
	}

	sessionID := c.Param("id")
	if sessionID == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "session id is required")
	}

	// Parse session UUID
	var sessionUUID pgtype.UUID
	if err := sessionUUID.Scan(sessionID); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid session id")
	}

	// Verify session belongs to user
	_, err = h.queries.GetSessionByID(c.Request().Context(), db.GetSessionByIDParams{
		ID:     sessionUUID,
		UserID: userID,
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return echo.NewHTTPError(http.StatusNotFound, "session not found")
		}
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to verify session")
	}

	// Get messages
	messages, err := h.queries.ListMessagesBySession(c.Request().Context(), sessionUUID)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to list messages")
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"messages": messages,
	})
}
