// Package services provides business logic services
package services

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"catetin/backend/internal/ai"
	"catetin/backend/internal/db"

	"github.com/jackc/pgx/v5/pgtype"
)

// WeeklySummaryService handles weekly summary generation and retrieval
type WeeklySummaryService struct {
	queries  *db.Queries
	pujangga *ai.PujanggaService
	location *time.Location // WIB timezone
}

// NewWeeklySummaryService creates a new weekly summary service
func NewWeeklySummaryService(queries *db.Queries, pujangga *ai.PujanggaService) *WeeklySummaryService {
	// Load WIB timezone (UTC+7)
	loc, err := time.LoadLocation("Asia/Jakarta")
	if err != nil {
		// Fallback to fixed offset if timezone data not available
		loc = time.FixedZone("WIB", 7*60*60)
	}

	return &WeeklySummaryService{
		queries:  queries,
		pujangga: pujangga,
		location: loc,
	}
}

// WeekBoundaries represents the start and end of a week
type WeekBoundaries struct {
	Start time.Time // Sunday 00:00:00 WIB
	End   time.Time // Saturday 23:59:59 WIB
}

// GetLastCompletedWeek returns the boundaries of the most recently completed week
// A week is considered "completed" if Saturday has passed
func (s *WeeklySummaryService) GetLastCompletedWeek(now time.Time) WeekBoundaries {
	// Convert to WIB
	nowWIB := now.In(s.location)

	// Find the most recent Saturday that has passed
	weekday := int(nowWIB.Weekday())

	// Days since last Saturday
	// Sunday=0, Monday=1, ... Saturday=6
	var daysSinceSaturday int
	if weekday == 6 {
		// Today is Saturday, so "last completed" is the previous week
		daysSinceSaturday = 7
	} else {
		// Sunday=1, Monday=2, ... Friday=6
		daysSinceSaturday = weekday + 1
	}

	// Get last Saturday (end of last completed week)
	lastSaturday := nowWIB.AddDate(0, 0, -daysSinceSaturday)
	lastSaturday = time.Date(lastSaturday.Year(), lastSaturday.Month(), lastSaturday.Day(), 23, 59, 59, 0, s.location)

	// Get the Sunday before that (start of that week)
	lastSunday := lastSaturday.AddDate(0, 0, -6)
	lastSunday = time.Date(lastSunday.Year(), lastSunday.Month(), lastSunday.Day(), 0, 0, 0, 0, s.location)

	return WeekBoundaries{
		Start: lastSunday,
		End:   lastSaturday,
	}
}

// GetCurrentWeek returns the boundaries of the current week (may not be complete)
func (s *WeeklySummaryService) GetCurrentWeek(now time.Time) WeekBoundaries {
	nowWIB := now.In(s.location)
	weekday := int(nowWIB.Weekday())

	// Find this week's Sunday
	thisSunday := nowWIB.AddDate(0, 0, -weekday)
	thisSunday = time.Date(thisSunday.Year(), thisSunday.Month(), thisSunday.Day(), 0, 0, 0, 0, s.location)

	// This week's Saturday
	thisSaturday := thisSunday.AddDate(0, 0, 6)
	thisSaturday = time.Date(thisSaturday.Year(), thisSaturday.Month(), thisSaturday.Day(), 23, 59, 59, 0, s.location)

	return WeekBoundaries{
		Start: thisSunday,
		End:   thisSaturday,
	}
}

// GenerateOrGetSummary retrieves existing summary or generates a new one for the last completed week
// This is the main method called when user opens /risalah
func (s *WeeklySummaryService) GenerateOrGetSummary(ctx context.Context, userID string) (*db.WeeklySummary, error) {
	now := time.Now()
	week := s.GetLastCompletedWeek(now)

	// Convert to pgtype.Date for query
	weekStartDate := pgtype.Date{
		Time:  week.Start,
		Valid: true,
	}

	// Check if summary already exists for this week
	existing, err := s.queries.GetWeeklySummary(ctx, db.GetWeeklySummaryParams{
		UserID:    userID,
		WeekStart: weekStartDate,
	})
	if err == nil {
		// Summary exists, return it
		return &existing, nil
	}

	// Summary doesn't exist, check if we have data for this week
	counts, err := s.queries.CountWeekSessions(ctx, db.CountWeekSessionsParams{
		UserID:      userID,
		StartedAt:   pgtype.Timestamptz{Time: week.Start, Valid: true},
		StartedAt_2: pgtype.Timestamptz{Time: week.End, Valid: true},
	})
	if err != nil {
		return nil, fmt.Errorf("failed to count week sessions: %w", err)
	}

	// Get messages for the week
	messages, err := s.queries.GetWeekMessages(ctx, db.GetWeekMessagesParams{
		UserID:      userID,
		StartedAt:   pgtype.Timestamptz{Time: week.Start, Valid: true},
		StartedAt_2: pgtype.Timestamptz{Time: week.End, Valid: true},
	})
	if err != nil {
		return nil, fmt.Errorf("failed to get week messages: %w", err)
	}

	// Convert to AI message format
	aiMessages := make([]ai.Message, len(messages))
	for i, msg := range messages {
		aiMessages[i] = ai.Message{
			Role:    "user",
			Content: msg.Content,
		}
	}

	// Generate summary via AI
	result, err := s.pujangga.GenerateWeeklySummary(ctx, aiMessages, int(counts.SessionCount), int(counts.MessageCount))
	if err != nil {
		return nil, fmt.Errorf("failed to generate summary: %w", err)
	}

	// Convert emotions to JSONB
	emotionsJSON, err := json.Marshal(map[string]interface{}{
		"dominant_emotion":   result.DominantEmotion,
		"secondary_emotions": result.SecondaryEmotions,
		"trend":              result.Trend,
		"insights":           result.Insights,
		"encouragement":      result.Encouragement,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to marshal emotions: %w", err)
	}

	// Save to database
	weekEndDate := pgtype.Date{
		Time:  week.End,
		Valid: true,
	}

	summary, err := s.queries.CreateWeeklySummary(ctx, db.CreateWeeklySummaryParams{
		UserID:       userID,
		WeekStart:    weekStartDate,
		WeekEnd:      weekEndDate,
		Summary:      result.Summary,
		SessionCount: counts.SessionCount,
		MessageCount: counts.MessageCount,
		Emotions:     emotionsJSON,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to save summary: %w", err)
	}

	return &summary, nil
}

// GetLatestSummary retrieves the most recent summary for a user (without generating)
func (s *WeeklySummaryService) GetLatestSummary(ctx context.Context, userID string) (*db.WeeklySummary, error) {
	summary, err := s.queries.GetLatestWeeklySummary(ctx, userID)
	if err != nil {
		return nil, err
	}
	return &summary, nil
}

// ListSummaries retrieves paginated list of summaries for a user
func (s *WeeklySummaryService) ListSummaries(ctx context.Context, userID string, limit, offset int32) ([]db.WeeklySummary, error) {
	return s.queries.ListWeeklySummaries(ctx, db.ListWeeklySummariesParams{
		UserID: userID,
		Limit:  limit,
		Offset: offset,
	})
}
