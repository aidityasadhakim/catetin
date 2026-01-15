// Package handlers provides HTTP request handlers
package handlers

import (
	"errors"
	"fmt"
	"net/http"

	"catetin/backend/internal/ai"
	"catetin/backend/internal/db"
	"catetin/backend/internal/middleware"
	"catetin/backend/internal/services"
	"catetin/backend/internal/types"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/labstack/echo/v4"
)

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
	var req types.RespondRequest
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request body")
	}

	if req.Content == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "content is required")
	}

	// Validate content length
	if len([]rune(req.Content)) > MaxMessageLength {
		return echo.NewHTTPError(http.StatusBadRequest,
			fmt.Sprintf("Pesan terlalu panjang. Maksimal %d karakter.", MaxMessageLength))
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
				"message":        fmt.Sprintf("Kamu sudah mencapai batas harian (%d pesan). Upgrade untuk melanjutkan.", FreePlanMessageLimit),
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
	wordCount := services.CountWords(req.Content)

	// Initialize rewards with default level info
	rewards := &types.Rewards{
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

	return c.JSON(http.StatusOK, types.RespondResponse{
		Message:      aiMessage,
		UserMessage:  userMessage,
		MessageCount: int(userMessageCount),
		DepthLevel:   depthLevel,
		Rewards:      rewards,
	})
}
