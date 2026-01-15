// Package handlers provides HTTP request handlers
package handlers

import (
	"encoding/hex"
	"net/http"

	"catetin/backend/internal/ai"
	"catetin/backend/internal/db"
	"catetin/backend/internal/middleware"
	"catetin/backend/internal/services"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/labstack/echo/v4"
)

// Handler holds dependencies for HTTP handlers
type Handler struct {
	queries       *db.Queries
	pujangga      *ai.PujanggaService
	gamification  *services.GamificationService
	leveling      *services.LevelingService
	weeklySummary *services.WeeklySummaryService
	supportEmail  string
}

// New creates a new Handler with the given dependencies
func New(queries *db.Queries, pujangga *ai.PujanggaService, gamification *services.GamificationService, leveling *services.LevelingService, weeklySummary *services.WeeklySummaryService, supportEmail string) *Handler {
	return &Handler{
		queries:       queries,
		pujangga:      pujangga,
		gamification:  gamification,
		leveling:      leveling,
		weeklySummary: weeklySummary,
		supportEmail:  supportEmail,
	}
}

// uuidToString converts a pgtype.UUID to a string
func uuidToString(u pgtype.UUID) string {
	if !u.Valid {
		return ""
	}
	return hex.EncodeToString(u.Bytes[0:4]) + "-" +
		hex.EncodeToString(u.Bytes[4:6]) + "-" +
		hex.EncodeToString(u.Bytes[6:8]) + "-" +
		hex.EncodeToString(u.Bytes[8:10]) + "-" +
		hex.EncodeToString(u.Bytes[10:16])
}

// requirePaidPlan checks if user has paid plan and returns error if not
func (h *Handler) requirePaidPlan(c echo.Context) error {
	userID := middleware.GetUserID(c)

	sub, err := h.queries.UpsertUserSubscription(c.Request().Context(), userID)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to get subscription")
	}

	if sub.Plan != "paid" {
		return c.JSON(http.StatusForbidden, map[string]interface{}{
			"error":       "PREMIUM_REQUIRED",
			"message":     "Risalah Mingguan hanya tersedia untuk pengguna Premium",
			"upgrade_url": "/pricing",
		})
	}

	return nil
}
