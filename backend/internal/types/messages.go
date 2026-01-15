// Package types provides shared request/response types for handlers
package types

// CreateMessageRequest is the request body for creating a message
type CreateMessageRequest struct {
	Role    string `json:"role"`    // "user" or "assistant"
	Content string `json:"content"` // Message content
}
