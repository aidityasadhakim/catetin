// Package handlers provides HTTP request handlers
package handlers

import (
	"net/http"

	"catetin/backend/internal/middleware"
	"catetin/backend/internal/types"

	"github.com/labstack/echo/v4"
)

// GetUserStats returns the user's stats, creating them if they don't exist
func (h *Handler) GetUserStats(c echo.Context) error {
	userID, err := middleware.RequireUserID(c)
	if err != nil {
		return err
	}

	stats, err := h.queries.UpsertUserStats(c.Request().Context(), userID)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to get user stats")
	}

	// Calculate level progress info
	var xpToNextLevel int32 = 100
	var levelProgress int32 = 0

	if h.leveling != nil {
		xpToNextLevel = h.leveling.XPToNextLevel(stats.Level, stats.TotalXp)
		levelProgress = h.leveling.GetLevelProgress(stats.Level, stats.TotalXp)
	}

	return c.JSON(http.StatusOK, types.UserStatsResponse{
		UserID:        stats.UserID,
		GoldenInk:     stats.GoldenInk,
		Marble:        stats.Marble,
		CurrentStreak: stats.CurrentStreak,
		LongestStreak: stats.LongestStreak,
		Level:         stats.Level,
		CurrentXP:     stats.CurrentXp,
		TotalXP:       stats.TotalXp,
		XPToNextLevel: xpToNextLevel,
		LevelProgress: levelProgress,
	})
}
