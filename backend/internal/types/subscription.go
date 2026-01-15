// Package types provides shared request/response types for handlers
package types

// SubscriptionResponse is the response for GetSubscription
type SubscriptionResponse struct {
	UserID         string  `json:"user_id"`
	Plan           string  `json:"plan"`
	UpgradedAt     *string `json:"upgraded_at"`
	MessagesToday  int32   `json:"messages_today"`
	MessageLimit   int32   `json:"message_limit"` // -1 for unlimited
	CanSendMessage bool    `json:"can_send_message"`
}
