// Package handlers provides HTTP request handlers
package handlers

import (
	"encoding/hex"
	"encoding/json"
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

// uuidToString converts a pgtype.UUID to a string
func uuidToString(u pgtype.UUID) string {
	if !u.Valid {
		return ""
	}
	return hex.EncodeToString(u.Bytes[0:4]) + "-" +
		hex.EncodeToString(u.Bytes[4:6]) + "-" +
		hex.EncodeToString(u.Bytes[6:8]) + "-" +
		hex.EncodeToString(u.Bytes[8:10]) + "-" +
		hex.EncodeToString(u.Bytes[10:16])
}

// Handler holds dependencies for HTTP handlers
type Handler struct {
	queries       *db.Queries
	pujangga      *ai.PujanggaService
	gamification  *services.GamificationService
	leveling      *services.LevelingService
	weeklySummary *services.WeeklySummaryService
	supportEmail  string
}

// New creates a new Handler with the given dependencies
func New(queries *db.Queries, pujangga *ai.PujanggaService, gamification *services.GamificationService, leveling *services.LevelingService, weeklySummary *services.WeeklySummaryService, supportEmail string) *Handler {
	return &Handler{
		queries:       queries,
		pujangga:      pujangga,
		gamification:  gamification,
		leveling:      leveling,
		weeklySummary: weeklySummary,
		supportEmail:  supportEmail,
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

// UserStatsResponse is the response for GetUserStats with level progress info
type UserStatsResponse struct {
	UserID        string `json:"user_id"`
	GoldenInk     int32  `json:"golden_ink"`
	Marble        int32  `json:"marble"`
	CurrentStreak int32  `json:"current_streak"`
	LongestStreak int32  `json:"longest_streak"`
	Level         int32  `json:"level"`
	CurrentXP     int32  `json:"current_xp"`
	TotalXP       int32  `json:"total_xp"`
	XPToNextLevel int32  `json:"xp_to_next_level"`
	LevelProgress int32  `json:"level_progress"` // 0-100 percentage
}

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

	// Calculate level progress info
	var xpToNextLevel int32 = 100
	var levelProgress int32 = 0

	if h.leveling != nil {
		xpToNextLevel = h.leveling.XPToNextLevel(stats.Level, stats.TotalXp)
		levelProgress = h.leveling.GetLevelProgress(stats.Level, stats.TotalXp)
	}

	return c.JSON(http.StatusOK, UserStatsResponse{
		UserID:        stats.UserID,
		GoldenInk:     stats.GoldenInk,
		Marble:        stats.Marble,
		CurrentStreak: stats.CurrentStreak,
		LongestStreak: stats.LongestStreak,
		Level:         stats.Level,
		CurrentXP:     stats.CurrentXp,
		TotalXP:       stats.TotalXp,
		XPToNextLevel: xpToNextLevel,
		LevelProgress: levelProgress,
	})
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
	type SessionWithPreview struct {
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

	result := make([]SessionWithPreview, len(sessions))
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

		result[i] = SessionWithPreview{
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
	Message      db.Message `json:"message"`       // The AI's response message
	UserMessage  db.Message `json:"user_message"`  // The saved user message
	MessageCount int        `json:"message_count"` // Total user messages in session
	DepthLevel   int        `json:"depth_level"`   // Conversation depth (1=surface, 2=light, 3=deep)
	Rewards      *Rewards   `json:"rewards"`       // Rewards earned for this message
}

// Rewards represents gamification rewards earned
type Rewards struct {
	TintaEmas     int32 `json:"tinta_emas"`
	Marmer        int32 `json:"marmer"`
	NewStreak     int32 `json:"new_streak"`
	XPEarned      int32 `json:"xp_earned"`
	Level         int32 `json:"level"`
	LeveledUp     bool  `json:"leveled_up"`
	XPToNextLevel int32 `json:"xp_to_next_level"`
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

	// Check subscription and message limit for free users
	sub, err := h.queries.UpsertUserSubscription(ctx, userID)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to check subscription")
	}

	if sub.Plan == "free" {
		messagesToday, err := h.queries.CountTodayUserMessages(ctx, userID)
		if err != nil {
			c.Logger().Errorf("failed to count today's messages: %v", err)
		} else if messagesToday >= FreePlanMessageLimit {
			return c.JSON(http.StatusForbidden, map[string]interface{}{
				"error":          "LIMIT_REACHED",
				"message":        "Kamu sudah mencapai batas harian (3 pesan). Upgrade untuk melanjutkan.",
				"upgrade_url":    "/pricing",
				"support_email":  h.supportEmail,
				"messages_today": messagesToday,
				"message_limit":  FreePlanMessageLimit,
			})
		}
	}

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

	// Get only the last 6 messages for sliding context (3 exchanges = 6 messages)
	recentMessages, err := h.queries.GetRecentMessages(ctx, db.GetRecentMessagesParams{
		SessionID: sessionUUID,
		Limit:     6,
	})
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to get conversation history")
	}

	// Reverse to get chronological order (query returns DESC)
	for i, j := 0, len(recentMessages)-1; i < j; i, j = i+1, j-1 {
		recentMessages[i], recentMessages[j] = recentMessages[j], recentMessages[i]
	}

	// Convert to AI message format
	aiMessages := make([]ai.Message, len(recentMessages))
	for i, msg := range recentMessages {
		aiMessages[i] = ai.Message{
			Role:    msg.Role,
			Content: msg.Content,
		}
	}

	// Count total user messages for depth calculation
	userMessageCount, err := h.queries.CountUserMessagesBySession(ctx, sessionUUID)
	if err != nil {
		c.Logger().Errorf("failed to count user messages: %v", err)
		userMessageCount = 1 // fallback
	}

	// Calculate depth level
	depthLevel := int(ai.CalculateDepth(int(userMessageCount)))

	// Generate AI response with sliding context
	aiResponse, err := h.pujangga.GenerateResponse(ctx, aiMessages, int(userMessageCount))
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

	// Calculate rewards for THIS message (incremental rewards)
	var rewards *Rewards
	wordCount := services.CountWords(req.Content)

	// Initialize rewards with default level info
	rewards = &Rewards{
		TintaEmas:     0,
		Marmer:        0,
		NewStreak:     0,
		XPEarned:      0,
		Level:         1,
		LeveledUp:     false,
		XPToNextLevel: 100,
	}

	// Calculate gamification rewards (Tinta Emas, Marmer, Streak)
	if h.gamification != nil {
		messageReward, err := h.gamification.CalculateMessageReward(ctx, userID, wordCount)
		if err != nil {
			c.Logger().Errorf("failed to calculate message reward: %v", err)
		} else {
			// Apply rewards immediately
			_, err = h.gamification.ApplyRewards(ctx, userID, messageReward)
			if err != nil {
				c.Logger().Errorf("failed to apply rewards: %v", err)
			} else {
				rewards.TintaEmas = messageReward.TintaEmas
				rewards.Marmer = messageReward.Marmer
				rewards.NewStreak = messageReward.NewStreak

				// Add earned golden ink to session
				_, _ = h.gamification.AddSessionReward(ctx, sessionUUID, messageReward.TintaEmas)
			}
		}
	}

	// Calculate leveling rewards (XP and Level)
	if h.leveling != nil {
		levelReward, err := h.leveling.AwardXP(ctx, userID, wordCount)
		if err != nil {
			c.Logger().Errorf("failed to award XP: %v", err)
		} else {
			rewards.XPEarned = levelReward.XPEarned
			rewards.Level = levelReward.Level
			rewards.LeveledUp = levelReward.LeveledUp
			rewards.XPToNextLevel = levelReward.XPToNextLevel
		}
	}

	return c.JSON(http.StatusOK, RespondResponse{
		Message:      aiMessage,
		UserMessage:  userMessage,
		MessageCount: int(userMessageCount),
		DepthLevel:   depthLevel,
		Rewards:      rewards,
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

// TodaySessionResponse is the response for GetOrCreateTodaySession
type TodaySessionResponse struct {
	Session    db.Session   `json:"session"`
	Messages   []db.Message `json:"messages"`
	IsNew      bool         `json:"is_new"`      // Whether this is a newly created session
	DepthLevel int          `json:"depth_level"` // Current conversation depth (1-3)
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

		return c.JSON(http.StatusOK, TodaySessionResponse{
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
		return c.JSON(http.StatusCreated, TodaySessionResponse{
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
		return c.JSON(http.StatusCreated, TodaySessionResponse{
			Session:    session,
			Messages:   []db.Message{},
			IsNew:      true,
			DepthLevel: 1,
		})
	}

	// Increment message count
	_, _ = h.queries.IncrementSessionMessages(ctx, session.ID)

	return c.JSON(http.StatusCreated, TodaySessionResponse{
		Session:    session,
		Messages:   []db.Message{openingMessage},
		IsNew:      true,
		DepthLevel: 1,
	})
}

// ==================== SUBSCRIPTION ====================

// SubscriptionResponse is the response for GetSubscription
type SubscriptionResponse struct {
	UserID         string  `json:"user_id"`
	Plan           string  `json:"plan"`
	UpgradedAt     *string `json:"upgraded_at"`
	MessagesToday  int32   `json:"messages_today"`
	MessageLimit   int32   `json:"message_limit"` // -1 for unlimited
	CanSendMessage bool    `json:"can_send_message"`
}

// FreePlanMessageLimit is the max messages per day for free users
const FreePlanMessageLimit = 3

// GetSubscription returns the user's subscription status
func (h *Handler) GetSubscription(c echo.Context) error {
	userID, err := middleware.RequireUserID(c)
	if err != nil {
		return err
	}

	ctx := c.Request().Context()

	// Get or create subscription (defaults to free)
	sub, err := h.queries.UpsertUserSubscription(ctx, userID)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to get subscription")
	}

	// Count today's messages
	messagesToday, err := h.queries.CountTodayUserMessages(ctx, userID)
	if err != nil {
		c.Logger().Errorf("failed to count today's messages: %v", err)
		messagesToday = 0
	}

	// Determine message limit and can_send_message
	var messageLimit int32 = -1 // unlimited for paid
	canSendMessage := true

	if sub.Plan == "free" {
		messageLimit = FreePlanMessageLimit
		canSendMessage = messagesToday < FreePlanMessageLimit
	}

	// Format upgraded_at
	var upgradedAt *string
	if sub.UpgradedAt.Valid {
		t := sub.UpgradedAt.Time.Format(time.RFC3339)
		upgradedAt = &t
	}

	return c.JSON(http.StatusOK, SubscriptionResponse{
		UserID:         sub.UserID,
		Plan:           sub.Plan,
		UpgradedAt:     upgradedAt,
		MessagesToday:  messagesToday,
		MessageLimit:   messageLimit,
		CanSendMessage: canSendMessage,
	})
}

// ==================== WEEKLY SUMMARIES ====================

// WeeklySummaryResponse represents a weekly summary for API responses
type WeeklySummaryResponse struct {
	ID           string                 `json:"id"`
	UserID       string                 `json:"user_id"`
	WeekStart    string                 `json:"week_start"`
	WeekEnd      string                 `json:"week_end"`
	Summary      string                 `json:"summary"`
	SessionCount int32                  `json:"session_count"`
	MessageCount int32                  `json:"message_count"`
	Emotions     map[string]interface{} `json:"emotions"`
	CreatedAt    string                 `json:"created_at"`
}

// ListSummariesResponse represents the list of weekly summaries
type ListSummariesResponse struct {
	Summaries []WeeklySummaryResponse `json:"summaries"`
	Total     int                     `json:"total"`
}

// convertWeeklySummary converts a db.WeeklySummary to WeeklySummaryResponse
func convertWeeklySummary(s *db.WeeklySummary) WeeklySummaryResponse {
	emotions := make(map[string]interface{})
	if s.Emotions != nil {
		_ = json.Unmarshal(s.Emotions, &emotions)
	}

	return WeeklySummaryResponse{
		ID:           uuidToString(s.ID),
		UserID:       s.UserID,
		WeekStart:    s.WeekStart.Time.Format("2006-01-02"),
		WeekEnd:      s.WeekEnd.Time.Format("2006-01-02"),
		Summary:      s.Summary,
		SessionCount: s.SessionCount,
		MessageCount: s.MessageCount,
		Emotions:     emotions,
		CreatedAt:    s.CreatedAt.Time.Format(time.RFC3339),
	}
}

// requirePaidPlan checks if user has paid plan and returns error if not
func (h *Handler) requirePaidPlan(c echo.Context) error {
	userID := middleware.GetUserID(c)

	sub, err := h.queries.UpsertUserSubscription(c.Request().Context(), userID)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to get subscription")
	}

	if sub.Plan != "paid" {
		return c.JSON(http.StatusForbidden, map[string]interface{}{
			"error":       "PREMIUM_REQUIRED",
			"message":     "Risalah Mingguan hanya tersedia untuk pengguna Premium",
			"upgrade_url": "/pricing",
		})
	}

	return nil
}

// ListSummaries returns paginated list of weekly summaries for the user
// GET /api/summaries
func (h *Handler) ListSummaries(c echo.Context) error {
	// Check premium access
	if err := h.requirePaidPlan(c); err != nil {
		return err
	}

	userID := middleware.GetUserID(c)
	ctx := c.Request().Context()

	// Parse pagination params
	limit := int32(10)
	offset := int32(0)

	if l := c.QueryParam("limit"); l != "" {
		if parsed, err := strconv.ParseInt(l, 10, 32); err == nil && parsed > 0 && parsed <= 50 {
			limit = int32(parsed)
		}
	}
	if o := c.QueryParam("offset"); o != "" {
		if parsed, err := strconv.ParseInt(o, 10, 32); err == nil && parsed >= 0 {
			offset = int32(parsed)
		}
	}

	summaries, err := h.weeklySummary.ListSummaries(ctx, userID, limit, offset)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to list summaries")
	}

	response := make([]WeeklySummaryResponse, len(summaries))
	for i := range summaries {
		response[i] = convertWeeklySummary(&summaries[i])
	}

	return c.JSON(http.StatusOK, ListSummariesResponse{
		Summaries: response,
		Total:     len(response),
	})
}

// GetLatestSummary returns the most recent weekly summary, generating if needed
// GET /api/summaries/latest
func (h *Handler) GetLatestSummary(c echo.Context) error {
	// Check premium access
	if err := h.requirePaidPlan(c); err != nil {
		return err
	}

	userID := middleware.GetUserID(c)
	ctx := c.Request().Context()

	// Generate or get summary for last completed week
	summary, err := h.weeklySummary.GenerateOrGetSummary(ctx, userID)
	if err != nil {
		c.Logger().Errorf("failed to generate/get summary: %v", err)
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to generate summary")
	}

	if summary == nil {
		return c.JSON(http.StatusOK, map[string]interface{}{
			"summary": nil,
			"message": "Belum ada jurnal minggu lalu. Mulai menulis untuk mendapatkan Risalah Mingguan!",
		})
	}

	return c.JSON(http.StatusOK, convertWeeklySummary(summary))
}
