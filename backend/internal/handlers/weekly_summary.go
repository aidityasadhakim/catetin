// Package handlers provides HTTP request handlers
package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"catetin/backend/internal/db"
	"catetin/backend/internal/middleware"
	"catetin/backend/internal/types"

	"github.com/labstack/echo/v4"
)

// convertWeeklySummary converts a db.WeeklySummary to WeeklySummaryResponse
func convertWeeklySummary(s *db.WeeklySummary) types.WeeklySummaryResponse {
	emotions := make(map[string]interface{})
	if s.Emotions != nil {
		_ = json.Unmarshal(s.Emotions, &emotions)
	}

	return types.WeeklySummaryResponse{
		ID:           uuidToString(s.ID),
		UserID:       s.UserID,
		WeekStart:    s.WeekStart.Time.Format("2006-01-02"),
		WeekEnd:      s.WeekEnd.Time.Format("2006-01-02"),
		Summary:      s.Summary,
		SessionCount: s.SessionCount,
		MessageCount: s.MessageCount,
		Emotions:     emotions,
		CreatedAt:    s.CreatedAt.Time.Format(time.RFC3339),
	}
}

// ListSummaries returns paginated list of weekly summaries for the user
// GET /api/summaries
func (h *Handler) ListSummaries(c echo.Context) error {
	// Check premium access
	if err := h.requirePaidPlan(c); err != nil {
		return err
	}

	userID := middleware.GetUserID(c)
	ctx := c.Request().Context()

	// Parse pagination params
	limit := int32(10)
	offset := int32(0)

	if l := c.QueryParam("limit"); l != "" {
		if parsed, err := strconv.ParseInt(l, 10, 32); err == nil && parsed > 0 && parsed <= 50 {
			limit = int32(parsed)
		}
	}
	if o := c.QueryParam("offset"); o != "" {
		if parsed, err := strconv.ParseInt(o, 10, 32); err == nil && parsed >= 0 {
			offset = int32(parsed)
		}
	}

	summaries, err := h.weeklySummary.ListSummaries(ctx, userID, limit, offset)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to list summaries")
	}

	response := make([]types.WeeklySummaryResponse, len(summaries))
	for i := range summaries {
		response[i] = convertWeeklySummary(&summaries[i])
	}

	return c.JSON(http.StatusOK, types.ListSummariesResponse{
		Summaries: response,
		Total:     len(response),
	})
}

// GetLatestSummary returns the most recent weekly summary, generating if needed
// GET /api/summaries/latest
func (h *Handler) GetLatestSummary(c echo.Context) error {
	// Check premium access
	if err := h.requirePaidPlan(c); err != nil {
		return err
	}

	userID := middleware.GetUserID(c)
	ctx := c.Request().Context()

	// Generate or get summary for last completed week
	summary, err := h.weeklySummary.GenerateOrGetSummary(ctx, userID)
	if err != nil {
		c.Logger().Errorf("failed to generate/get summary: %v", err)
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to generate summary")
	}

	if summary == nil {
		return c.JSON(http.StatusOK, map[string]interface{}{
			"summary": nil,
			"message": "Belum ada jurnal minggu lalu. Mulai menulis untuk mendapatkan Risalah Mingguan!",
		})
	}

	return c.JSON(http.StatusOK, convertWeeklySummary(summary))
}
