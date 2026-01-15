// Package types provides shared request/response types for handlers
package types

import "catetin/backend/internal/db"

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
