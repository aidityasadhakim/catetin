// Package types provides shared request/response types for handlers
package types

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
