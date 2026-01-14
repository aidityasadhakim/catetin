// Package services provides business logic services
package services

import (
	"context"
	"encoding/json"
	"log"
	"regexp"
	"strings"
	"time"

	"catetin/backend/internal/db"

	"github.com/clerk/clerk-sdk-go/v2"
	"github.com/clerk/clerk-sdk-go/v2/user"
	"github.com/jackc/pgx/v5/pgtype"
)

// TrakteerPayload represents the webhook payload from Trakteer
type TrakteerPayload struct {
	CreatedAt        string `json:"created_at"`
	TransactionID    string `json:"transaction_id"`
	Type             string `json:"type"`
	SupporterName    string `json:"supporter_name"`
	SupporterAvatar  string `json:"supporter_avatar"`
	SupporterMessage string `json:"supporter_message"`
	Unit             string `json:"unit"`
	UnitIcon         string `json:"unit_icon"`
	Quantity         int    `json:"quantity"`
	Price            int    `json:"price"`
	NetAmount        int    `json:"net_amount"`
}

// MinimumPaymentAmount is the minimum payment in IDR (10 Cendol = 50k)
const MinimumPaymentAmount = 50000

// WebhookProcessor handles async processing of Trakteer webhooks
type WebhookProcessor struct {
	queue   chan TrakteerPayload
	queries *db.Queries
}

// NewWebhookProcessor creates a new webhook processor
func NewWebhookProcessor(queries *db.Queries) *WebhookProcessor {
	wp := &WebhookProcessor{
		queue:   make(chan TrakteerPayload, 100),
		queries: queries,
	}
	go wp.worker()
	return wp
}

// Enqueue adds a webhook payload to the processing queue
func (wp *WebhookProcessor) Enqueue(payload TrakteerPayload) {
	select {
	case wp.queue <- payload:
		log.Printf("[WebhookProcessor] Enqueued transaction: %s", payload.TransactionID)
	default:
		log.Printf("[WebhookProcessor] Queue full, dropping transaction: %s", payload.TransactionID)
	}
}

// worker processes webhooks from the queue
func (wp *WebhookProcessor) worker() {
	for payload := range wp.queue {
		wp.processPayload(payload)
	}
}

// processPayload handles a single webhook payload
func (wp *WebhookProcessor) processPayload(payload TrakteerPayload) {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	log.Printf("[WebhookProcessor] Processing transaction: %s from %s", payload.TransactionID, payload.SupporterName)

	// Check if transaction was already processed (idempotency)
	processed, err := wp.queries.CheckTransactionProcessed(ctx, pgtype.Text{String: payload.TransactionID, Valid: true})
	if err != nil {
		log.Printf("[WebhookProcessor] Error checking transaction: %v", err)
		return
	}
	if processed {
		log.Printf("[WebhookProcessor] Transaction already processed: %s", payload.TransactionID)
		return
	}

	// Validate minimum payment
	if payload.Price < MinimumPaymentAmount {
		log.Printf("[WebhookProcessor] Payment too low: %d < %d for transaction: %s", payload.Price, MinimumPaymentAmount, payload.TransactionID)
		wp.savePendingUpgrade(ctx, payload, "payment amount below minimum")
		return
	}

	// Extract email from supporter message
	email := extractEmail(payload.SupporterMessage)
	if email == "" {
		log.Printf("[WebhookProcessor] No email found in message for transaction: %s", payload.TransactionID)
		wp.savePendingUpgrade(ctx, payload, "no email found in message")
		return
	}

	log.Printf("[WebhookProcessor] Extracted email: %s", email)

	// Look up user by email via Clerk
	clerkUser, err := findUserByEmail(ctx, email)
	if err != nil {
		log.Printf("[WebhookProcessor] User not found for email %s: %v", email, err)
		wp.savePendingUpgrade(ctx, payload, "user not found for email")
		return
	}

	// Upgrade user to paid
	_, err = wp.queries.CreateUserSubscriptionAsPaid(ctx, db.CreateUserSubscriptionAsPaidParams{
		UserID:                clerkUser.ID,
		TrakteerTransactionID: pgtype.Text{String: payload.TransactionID, Valid: true},
		TrakteerSupporterName: pgtype.Text{String: payload.SupporterName, Valid: true},
		PaymentAmount:         pgtype.Int4{Int32: int32(payload.Price), Valid: true},
	})
	if err != nil {
		log.Printf("[WebhookProcessor] Error upgrading user %s: %v", clerkUser.ID, err)
		wp.savePendingUpgrade(ctx, payload, "failed to upgrade user: "+err.Error())
		return
	}

	log.Printf("[WebhookProcessor] Successfully upgraded user %s (email: %s) to paid plan", clerkUser.ID, email)
}

// savePendingUpgrade saves a failed upgrade for manual review
func (wp *WebhookProcessor) savePendingUpgrade(ctx context.Context, payload TrakteerPayload, errorMessage string) {
	// Marshal payload to JSON
	rawPayload, _ := json.Marshal(payload)

	email := extractEmail(payload.SupporterMessage)
	if email == "" {
		email = payload.SupporterMessage // Store the whole message if no email found
	}

	_, err := wp.queries.CreatePendingUpgrade(ctx, db.CreatePendingUpgradeParams{
		TrakteerTransactionID: payload.TransactionID,
		SupporterEmail:        email,
		SupporterName:         payload.SupporterName,
		PaymentAmount:         int32(payload.Price),
		RawPayload:            rawPayload,
		ErrorMessage:          pgtype.Text{String: errorMessage, Valid: true},
	})
	if err != nil {
		log.Printf("[WebhookProcessor] Error saving pending upgrade: %v", err)
	} else {
		log.Printf("[WebhookProcessor] Saved pending upgrade for transaction: %s", payload.TransactionID)
	}
}

// extractEmail extracts an email address from a string
func extractEmail(message string) string {
	// Try to find email pattern in the message
	emailRegex := regexp.MustCompile(`[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}`)
	matches := emailRegex.FindStringSubmatch(message)
	if len(matches) > 0 {
		return strings.ToLower(strings.TrimSpace(matches[0]))
	}
	// Fallback: treat entire message as email if it looks like one
	trimmed := strings.ToLower(strings.TrimSpace(message))
	if emailRegex.MatchString(trimmed) {
		return trimmed
	}
	return ""
}

// findUserByEmail looks up a Clerk user by email address
func findUserByEmail(ctx context.Context, email string) (*clerk.User, error) {
	// Normalize email
	email = strings.ToLower(strings.TrimSpace(email))

	// List users with email filter
	params := &user.ListParams{}
	params.EmailAddresses = []string{email}

	users, err := user.List(ctx, params)
	if err != nil {
		return nil, err
	}

	if users == nil || users.TotalCount == 0 {
		return nil, &UserNotFoundError{Email: email}
	}

	return users.Users[0], nil
}

// UserNotFoundError represents a user not found error
type UserNotFoundError struct {
	Email string
}

func (e *UserNotFoundError) Error() string {
	return "user not found for email: " + e.Email
}
