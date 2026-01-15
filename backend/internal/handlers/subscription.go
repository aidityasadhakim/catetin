// Package handlers provides HTTP request handlers
package handlers

import (
	"net/http"
	"time"

	"catetin/backend/internal/middleware"
	"catetin/backend/internal/types"

	"github.com/labstack/echo/v4"
)

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

	return c.JSON(http.StatusOK, types.SubscriptionResponse{
		UserID:         sub.UserID,
		Plan:           sub.Plan,
		UpgradedAt:     upgradedAt,
		MessagesToday:  messagesToday,
		MessageLimit:   messageLimit,
		CanSendMessage: canSendMessage,
	})
}
