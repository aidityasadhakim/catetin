// Package types provides shared request/response types for handlers
package types

import "catetin/backend/internal/db"

// UpdateSessionRequest is the request body for updating a session
type UpdateSessionRequest struct {
	Status string `json:"status"` // "completed" or "abandoned"
}

// TodaySessionResponse is the response for GetOrCreateTodaySession
type TodaySessionResponse struct {
	Session    db.Session   `json:"session"`
	Messages   []db.Message `json:"messages"`
	IsNew      bool         `json:"is_new"`      // Whether this is a newly created session
	DepthLevel int          `json:"depth_level"` // Current conversation depth (1-3)
}
