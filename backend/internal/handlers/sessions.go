// Package handlers provides HTTP request handlers
package handlers

import (
	"errors"
	"net/http"
	"strconv"
	"time"

	"catetin/backend/internal/ai"
	"catetin/backend/internal/db"
	"catetin/backend/internal/middleware"
	"catetin/backend/internal/types"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/labstack/echo/v4"
)

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

// ListSessions returns a paginated list of the user's sessions with first message preview
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

	sessions, err := h.queries.ListSessionsWithPreview(c.Request().Context(), db.ListSessionsWithPreviewParams{
		UserID: userID,
		Limit:  limit,
		Offset: offset,
	})
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to list sessions")
	}

	// Transform to response format with proper string handling for first_user_message
	type sessionWithPreview struct {
		ID               string  `json:"id"`
		UserID           string  `json:"user_id"`
		Status           string  `json:"status"`
		TotalMessages    int32   `json:"total_messages"`
		GoldenInkEarned  int32   `json:"golden_ink_earned"`
		StartedAt        string  `json:"started_at"`
		EndedAt          *string `json:"ended_at"`
		CreatedAt        string  `json:"created_at"`
		UpdatedAt        string  `json:"updated_at"`
		FirstUserMessage string  `json:"first_user_message"`
	}

	result := make([]sessionWithPreview, len(sessions))
	for i, s := range sessions {
		var endedAt *string
		if s.EndedAt.Valid {
			t := s.EndedAt.Time.Format(time.RFC3339)
			endedAt = &t
		}

		firstMsg := ""
		if s.FirstUserMessage != nil {
			if str, ok := s.FirstUserMessage.(string); ok {
				firstMsg = str
			}
		}

		result[i] = sessionWithPreview{
			ID:               uuidToString(s.ID),
			UserID:           s.UserID,
			Status:           s.Status,
			TotalMessages:    s.TotalMessages,
			GoldenInkEarned:  s.GoldenInkEarned,
			StartedAt:        s.StartedAt.Time.Format(time.RFC3339),
			EndedAt:          endedAt,
			CreatedAt:        s.CreatedAt.Time.Format(time.RFC3339),
			UpdatedAt:        s.UpdatedAt.Time.Format(time.RFC3339),
			FirstUserMessage: firstMsg,
		}
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"sessions": result,
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
	var req types.UpdateSessionRequest
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

// StartSession creates a new session and generates the opening AI message
func (h *Handler) StartSession(c echo.Context) error {
	userID, err := middleware.RequireUserID(c)
	if err != nil {
		return err
	}

	// Check if AI service is available
	if h.pujangga == nil {
		return echo.NewHTTPError(http.StatusServiceUnavailable, "AI service is not configured")
	}

	ctx := c.Request().Context()

	// Create new session
	session, err := h.queries.CreateSession(ctx, userID)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to create session")
	}

	// Generate opening message from AI
	openingResponse, err := h.pujangga.GenerateOpeningMessage(ctx)
	if err != nil {
		c.Logger().Errorf("failed to generate opening message: %v", err)
		// Still return the session, just without an opening message
		return c.JSON(http.StatusCreated, map[string]interface{}{
			"session":         session,
			"opening_message": nil,
		})
	}

	// Save the opening message
	openingMessage, err := h.queries.CreateMessage(ctx, db.CreateMessageParams{
		SessionID: session.ID,
		Role:      "assistant",
		Content:   openingResponse.Message,
	})
	if err != nil {
		c.Logger().Errorf("failed to save opening message: %v", err)
		return c.JSON(http.StatusCreated, map[string]interface{}{
			"session":         session,
			"opening_message": nil,
		})
	}

	// Increment message count
	_, _ = h.queries.IncrementSessionMessages(ctx, session.ID)

	return c.JSON(http.StatusCreated, map[string]interface{}{
		"session":         session,
		"opening_message": openingMessage,
	})
}

// GetOrCreateTodaySession gets the active session for today, or creates a new one
func (h *Handler) GetOrCreateTodaySession(c echo.Context) error {
	userID, err := middleware.RequireUserID(c)
	if err != nil {
		return err
	}

	ctx := c.Request().Context()

	// Try to get today's active session
	session, err := h.queries.GetTodayActiveSession(ctx, userID)
	if err == nil {
		// Found existing session - return it with messages
		messages, err := h.queries.ListMessagesBySession(ctx, session.ID)
		if err != nil {
			c.Logger().Errorf("failed to get messages: %v", err)
			messages = []db.Message{}
		}

		// Count user messages for depth calculation
		userMessageCount := 0
		for _, msg := range messages {
			if msg.Role == "user" {
				userMessageCount++
			}
		}
		depthLevel := int(ai.CalculateDepth(userMessageCount))

		return c.JSON(http.StatusOK, types.TodaySessionResponse{
			Session:    session,
			Messages:   messages,
			IsNew:      false,
			DepthLevel: depthLevel,
		})
	}

	// No session today - create a new one
	if h.pujangga == nil {
		return echo.NewHTTPError(http.StatusServiceUnavailable, "AI service is not configured")
	}

	// Create new session
	session, err = h.queries.CreateSession(ctx, userID)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to create session")
	}

	// Generate opening message from AI
	openingResponse, err := h.pujangga.GenerateOpeningMessage(ctx)
	if err != nil {
		c.Logger().Errorf("failed to generate opening message: %v", err)
		// Return session without opening message
		return c.JSON(http.StatusCreated, types.TodaySessionResponse{
			Session:    session,
			Messages:   []db.Message{},
			IsNew:      true,
			DepthLevel: 1,
		})
	}

	// Save the opening message
	openingMessage, err := h.queries.CreateMessage(ctx, db.CreateMessageParams{
		SessionID: session.ID,
		Role:      "assistant",
		Content:   openingResponse.Message,
	})
	if err != nil {
		c.Logger().Errorf("failed to save opening message: %v", err)
		return c.JSON(http.StatusCreated, types.TodaySessionResponse{
			Session:    session,
			Messages:   []db.Message{},
			IsNew:      true,
			DepthLevel: 1,
		})
	}

	// Increment message count
	_, _ = h.queries.IncrementSessionMessages(ctx, session.ID)

	return c.JSON(http.StatusCreated, types.TodaySessionResponse{
		Session:    session,
		Messages:   []db.Message{openingMessage},
		IsNew:      true,
		DepthLevel: 1,
	})
}
