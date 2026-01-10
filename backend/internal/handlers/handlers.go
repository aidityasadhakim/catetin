// Package handlers provides HTTP request handlers
package handlers

import (
	"errors"
	"net/http"
	"strconv"
	"time"

	"catetin/backend/internal/db"
	"catetin/backend/internal/middleware"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
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

// ==================== USER STATS ====================

// GetUserStats returns the user's stats, creating them if they don't exist
func (h *Handler) GetUserStats(c echo.Context) error {
	userID, err := middleware.RequireUserID(c)
	if err != nil {
		return err
	}

	stats, err := h.queries.UpsertUserStats(c.Request().Context(), userID)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to get user stats")
	}

	return c.JSON(http.StatusOK, stats)
}

// ==================== SESSIONS ====================

// CreateSession creates a new journaling session
func (h *Handler) CreateSession(c echo.Context) error {
	userID, err := middleware.RequireUserID(c)
	if err != nil {
		return err
	}

	session, err := h.queries.CreateSession(c.Request().Context(), userID)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to create session")
	}

	return c.JSON(http.StatusCreated, session)
}

// ListSessions returns a paginated list of the user's sessions
func (h *Handler) ListSessions(c echo.Context) error {
	userID, err := middleware.RequireUserID(c)
	if err != nil {
		return err
	}

	// Parse pagination params
	limit := int32(20)
	offset := int32(0)

	if l := c.QueryParam("limit"); l != "" {
		if parsed, err := strconv.ParseInt(l, 10, 32); err == nil && parsed > 0 && parsed <= 100 {
			limit = int32(parsed)
		}
	}
	if o := c.QueryParam("offset"); o != "" {
		if parsed, err := strconv.ParseInt(o, 10, 32); err == nil && parsed >= 0 {
			offset = int32(parsed)
		}
	}

	sessions, err := h.queries.ListSessionsByUser(c.Request().Context(), db.ListSessionsByUserParams{
		UserID: userID,
		Limit:  limit,
		Offset: offset,
	})
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to list sessions")
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"sessions": sessions,
		"limit":    limit,
		"offset":   offset,
	})
}

// GetSession returns a single session with its messages
func (h *Handler) GetSession(c echo.Context) error {
	userID, err := middleware.RequireUserID(c)
	if err != nil {
		return err
	}

	sessionID := c.Param("id")
	if sessionID == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "session id is required")
	}

	// Parse UUID
	var uuid pgtype.UUID
	if err := uuid.Scan(sessionID); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid session id")
	}

	// Get the session (ensures it belongs to the user)
	session, err := h.queries.GetSessionByID(c.Request().Context(), db.GetSessionByIDParams{
		ID:     uuid,
		UserID: userID,
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return echo.NewHTTPError(http.StatusNotFound, "session not found")
		}
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to get session")
	}

	// Get messages for the session
	messages, err := h.queries.ListMessagesBySession(c.Request().Context(), uuid)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to get messages")
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"session":  session,
		"messages": messages,
	})
}

// UpdateSessionRequest is the request body for updating a session
type UpdateSessionRequest struct {
	Status string `json:"status"` // "completed" or "abandoned"
}

// UpdateSession updates a session (end it with a status)
func (h *Handler) UpdateSession(c echo.Context) error {
	userID, err := middleware.RequireUserID(c)
	if err != nil {
		return err
	}

	sessionID := c.Param("id")
	if sessionID == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "session id is required")
	}

	// Parse UUID
	var uuid pgtype.UUID
	if err := uuid.Scan(sessionID); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid session id")
	}

	// Parse request body
	var req UpdateSessionRequest
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request body")
	}

	// Validate status
	if req.Status != "completed" && req.Status != "abandoned" {
		return echo.NewHTTPError(http.StatusBadRequest, "status must be 'completed' or 'abandoned'")
	}

	// End the session
	session, err := h.queries.EndSession(c.Request().Context(), db.EndSessionParams{
		ID:     uuid,
		Status: req.Status,
		UserID: userID,
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return echo.NewHTTPError(http.StatusNotFound, "session not found")
		}
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to update session")
	}

	return c.JSON(http.StatusOK, session)
}

// ==================== MESSAGES ====================

// CreateMessageRequest is the request body for creating a message
type CreateMessageRequest struct {
	Role    string `json:"role"`    // "user" or "assistant"
	Content string `json:"content"` // Message content
}

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
	var req CreateMessageRequest
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
