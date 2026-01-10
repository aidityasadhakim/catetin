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
	"catetin/backend/internal/services"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/labstack/echo/v4"
)

// Handler holds dependencies for HTTP handlers
type Handler struct {
	queries      *db.Queries
	pujangga     *ai.PujanggaService
	gamification *services.GamificationService
}

// New creates a new Handler with the given dependencies
func New(queries *db.Queries, pujangga *ai.PujanggaService, gamification *services.GamificationService) *Handler {
	return &Handler{
		queries:      queries,
		pujangga:     pujangga,
		gamification: gamification,
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

// ==================== AI RESPONSE ====================

// RespondRequest is the request body for AI response
type RespondRequest struct {
	Content string `json:"content"` // User's message content
}

// RespondResponse is the response from AI
type RespondResponse struct {
	Message     db.Message `json:"message"`      // The AI's response message
	TurnNumber  int        `json:"turn_number"`  // Current turn (1, 2, or 3)
	IsComplete  bool       `json:"is_complete"`  // Whether this was the final turn
	Rewards     *Rewards   `json:"rewards"`      // Rewards earned (only on turn 3)
	UserMessage db.Message `json:"user_message"` // The saved user message
}

// Rewards represents gamification rewards earned
type Rewards struct {
	TintaEmas int32 `json:"tinta_emas"`
	Marmer    int32 `json:"marmer"`
	NewStreak int32 `json:"new_streak"`
}

// Respond generates an AI response for the user's message
func (h *Handler) Respond(c echo.Context) error {
	userID, err := middleware.RequireUserID(c)
	if err != nil {
		return err
	}

	// Check if AI service is available
	if h.pujangga == nil {
		return echo.NewHTTPError(http.StatusServiceUnavailable, "AI service is not configured")
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

	// Verify session belongs to user and get session info
	session, err := h.queries.GetSessionByID(c.Request().Context(), db.GetSessionByIDParams{
		ID:     sessionUUID,
		UserID: userID,
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return echo.NewHTTPError(http.StatusNotFound, "session not found")
		}
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to get session")
	}

	// Check if session is still active
	if session.Status != "active" {
		return echo.NewHTTPError(http.StatusBadRequest, "session is no longer active")
	}

	// Parse request body
	var req RespondRequest
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request body")
	}

	if req.Content == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "content is required")
	}

	ctx := c.Request().Context()

	// Save the user's message first
	userMessage, err := h.queries.CreateMessage(ctx, db.CreateMessageParams{
		SessionID: sessionUUID,
		Role:      "user",
		Content:   req.Content,
	})
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to save user message")
	}

	// Increment message count
	_, _ = h.queries.IncrementSessionMessages(ctx, sessionUUID)

	// Get existing messages to build conversation history
	existingMessages, err := h.queries.ListMessagesBySession(ctx, sessionUUID)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to get conversation history")
	}

	// Convert to AI message format
	aiMessages := make([]ai.Message, len(existingMessages))
	for i, msg := range existingMessages {
		aiMessages[i] = ai.Message{
			Role:    msg.Role,
			Content: msg.Content,
		}
	}

	// Calculate turn number (user messages count as turns)
	userMessageCount := 0
	for _, msg := range existingMessages {
		if msg.Role == "user" {
			userMessageCount++
		}
	}
	turnNumber := userMessageCount // This includes the message we just added

	// Generate AI response
	aiResponse, err := h.pujangga.GenerateResponse(ctx, aiMessages, turnNumber)
	if err != nil {
		c.Logger().Errorf("AI response error: %v", err)
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to generate AI response")
	}

	// Save the AI's response
	aiMessage, err := h.queries.CreateMessage(ctx, db.CreateMessageParams{
		SessionID: sessionUUID,
		Role:      "assistant",
		Content:   aiResponse.Message,
	})
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to save AI response")
	}

	// Increment message count for AI message
	_, _ = h.queries.IncrementSessionMessages(ctx, sessionUUID)

	// Check if this is the final turn (turn 3)
	isComplete := turnNumber >= 3
	var rewards *Rewards

	if isComplete {
		// End the session
		_, err = h.queries.EndSession(ctx, db.EndSessionParams{
			ID:     sessionUUID,
			Status: "completed",
			UserID: userID,
		})
		if err != nil {
			c.Logger().Errorf("failed to end session: %v", err)
		}

		// Calculate rewards if gamification service is available
		if h.gamification != nil {
			// Count total words from user messages
			totalWords := 0
			for _, msg := range existingMessages {
				if msg.Role == "user" {
					totalWords += services.CountWords(msg.Content)
				}
			}

			calculatedRewards, err := h.gamification.CalculateRewards(ctx, userID, totalWords)
			if err != nil {
				c.Logger().Errorf("failed to calculate rewards: %v", err)
			} else {
				// Apply rewards
				_, err = h.gamification.ApplyRewards(ctx, userID, calculatedRewards)
				if err != nil {
					c.Logger().Errorf("failed to apply rewards: %v", err)
				} else {
					rewards = &Rewards{
						TintaEmas: calculatedRewards.TintaEmas,
						Marmer:    calculatedRewards.Marmer,
						NewStreak: calculatedRewards.NewStreak,
					}

					// Add earned golden ink to session
					_, _ = h.gamification.AddSessionReward(ctx, sessionUUID, calculatedRewards.TintaEmas)
				}
			}
		}
	}

	return c.JSON(http.StatusOK, RespondResponse{
		Message:     aiMessage,
		TurnNumber:  turnNumber,
		IsComplete:  isComplete,
		Rewards:     rewards,
		UserMessage: userMessage,
	})
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
