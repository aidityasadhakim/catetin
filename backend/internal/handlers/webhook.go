// Package handlers provides HTTP request handlers
package handlers

import (
	"net/http"

	"catetin/backend/internal/services"

	"github.com/labstack/echo/v4"
)

// WebhookHandler holds dependencies for webhook HTTP handlers
type WebhookHandler struct {
	webhookProcessor *services.WebhookProcessor
	webhookToken     string
}

// NewWebhookHandler creates a new WebhookHandler with the given dependencies
func NewWebhookHandler(webhookProcessor *services.WebhookProcessor, webhookToken string) *WebhookHandler {
	return &WebhookHandler{
		webhookProcessor: webhookProcessor,
		webhookToken:     webhookToken,
	}
}

// TrakteerWebhook handles incoming Trakteer webhook requests
func (h *WebhookHandler) TrakteerWebhook(c echo.Context) error {
	// Validate webhook token
	token := c.Request().Header.Get("X-Webhook-Token")
	if token == "" {
		token = c.Request().Header.Get("x-webhook-token") // Case-insensitive fallback
	}

	if h.webhookToken != "" && token != h.webhookToken {
		c.Logger().Warnf("Invalid webhook token received")
		return c.JSON(http.StatusForbidden, map[string]interface{}{
			"error":   "INVALID_WEBHOOK_TOKEN",
			"message": "Invalid or missing webhook token",
		})
	}

	// Parse request body
	var payload services.TrakteerPayload
	if err := c.Bind(&payload); err != nil {
		c.Logger().Errorf("Invalid webhook payload: %v", err)
		return c.JSON(http.StatusBadRequest, map[string]interface{}{
			"error":   "INVALID_PAYLOAD",
			"message": "Invalid webhook payload format",
		})
	}

	// Validate required fields
	if payload.TransactionID == "" {
		return c.JSON(http.StatusBadRequest, map[string]interface{}{
			"error":   "INVALID_PAYLOAD",
			"message": "Missing transaction_id",
		})
	}

	// Enqueue for async processing
	if h.webhookProcessor != nil {
		h.webhookProcessor.Enqueue(payload)
	} else {
		c.Logger().Warn("Webhook processor not configured, ignoring webhook")
	}

	// Return success immediately (async processing)
	return c.JSON(http.StatusOK, map[string]interface{}{
		"status":  "queued",
		"message": "Webhook received and queued for processing",
	})
}
