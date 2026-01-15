// Package types provides shared request/response types for handlers
package types

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
