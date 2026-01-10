// Package services provides business logic services
package services

import (
	"context"
	"time"

	"catetin/backend/internal/db"

	"github.com/jackc/pgx/v5/pgtype"
)

// GamificationService handles reward calculations and gamification logic
type GamificationService struct {
	queries *db.Queries
	config  GamificationConfig
}

// GamificationConfig holds configurable values for the gamification system
type GamificationConfig struct {
	// TintaEmasPerWord controls how many words are needed per 1 Tinta Emas
	// Default: 10 words = 1 Tinta Emas
	TintaEmasPerWord int

	// MarmerBaseReward is the base amount of Marmer earned for continuing a streak
	MarmerBaseReward int

	// MarmerStreakBonus adds extra Marmer based on streak length
	// Formula: MarmerBaseReward + (CurrentStreak / MarmerStreakDivisor)
	MarmerStreakDivisor int
}

// DefaultGamificationConfig returns the default gamification configuration
func DefaultGamificationConfig() GamificationConfig {
	return GamificationConfig{
		TintaEmasPerWord:    10, // 10 words = 1 Tinta Emas
		MarmerBaseReward:    1,  // Base Marmer per streak day
		MarmerStreakDivisor: 7,  // Bonus Marmer every 7 days of streak
	}
}

// NewGamificationService creates a new GamificationService
func NewGamificationService(queries *db.Queries, config *GamificationConfig) *GamificationService {
	cfg := DefaultGamificationConfig()
	if config != nil {
		cfg = *config
	}
	return &GamificationService{
		queries: queries,
		config:  cfg,
	}
}

// Rewards represents the calculated rewards for a session
type Rewards struct {
	TintaEmas     int32 `json:"tinta_emas"`
	Marmer        int32 `json:"marmer"`
	StreakUpdated bool  `json:"streak_updated"`
	NewStreak     int32 `json:"new_streak"`
}

// CalculateRewards determines Tinta Emas and Marmer earned for a session
func (s *GamificationService) CalculateRewards(ctx context.Context, userID string, wordCount int) (*Rewards, error) {
	// Calculate Tinta Emas based on word count
	tintaEmas := int32(0)
	if s.config.TintaEmasPerWord > 0 {
		tintaEmas = int32(wordCount / s.config.TintaEmasPerWord)
	}

	// Get current user stats for streak calculation
	stats, err := s.queries.GetUserStats(ctx, userID)
	if err != nil {
		// User stats don't exist yet, create them
		stats, err = s.queries.CreateUserStats(ctx, userID)
		if err != nil {
			return nil, err
		}
	}

	// Calculate streak and Marmer
	today := time.Now().UTC().Truncate(24 * time.Hour)
	var marmer int32 = 0
	var newStreak int32 = 1
	streakUpdated := false

	if stats.LastActiveDate.Valid {
		lastActive := stats.LastActiveDate.Time
		daysSinceActive := int(today.Sub(lastActive).Hours() / 24)

		switch {
		case daysSinceActive == 0:
			// Already active today, no streak change, no Marmer
			newStreak = stats.CurrentStreak
		case daysSinceActive == 1:
			// Consecutive day - streak continues!
			newStreak = stats.CurrentStreak + 1
			streakUpdated = true
			// Calculate Marmer with streak bonus
			marmer = int32(s.config.MarmerBaseReward)
			if s.config.MarmerStreakDivisor > 0 {
				marmer += newStreak / int32(s.config.MarmerStreakDivisor)
			}
		default:
			// Streak broken - reset to 1
			newStreak = 1
			streakUpdated = true
			marmer = int32(s.config.MarmerBaseReward) // Still get base Marmer for starting new streak
		}
	} else {
		// First time user, start streak at 1
		streakUpdated = true
		marmer = int32(s.config.MarmerBaseReward)
	}

	return &Rewards{
		TintaEmas:     tintaEmas,
		Marmer:        marmer,
		StreakUpdated: streakUpdated,
		NewStreak:     newStreak,
	}, nil
}

// ApplyRewards applies the calculated rewards to the user's stats
func (s *GamificationService) ApplyRewards(ctx context.Context, userID string, rewards *Rewards) (*db.UserStat, error) {
	var stats db.UserStat
	var err error

	// Add Tinta Emas
	if rewards.TintaEmas > 0 {
		stats, err = s.queries.AddGoldenInk(ctx, db.AddGoldenInkParams{
			UserID:    userID,
			GoldenInk: rewards.TintaEmas,
		})
		if err != nil {
			return nil, err
		}
	}

	// Add Marmer
	if rewards.Marmer > 0 {
		stats, err = s.queries.AddMarble(ctx, db.AddMarbleParams{
			UserID: userID,
			Marble: rewards.Marmer,
		})
		if err != nil {
			return nil, err
		}
	}

	// Update streak
	if rewards.StreakUpdated {
		today := time.Now().UTC().Truncate(24 * time.Hour)
		stats, err = s.queries.UpdateStreak(ctx, db.UpdateStreakParams{
			UserID:        userID,
			CurrentStreak: rewards.NewStreak,
			LastActiveDate: pgtype.Date{
				Time:  today,
				Valid: true,
			},
		})
		if err != nil {
			return nil, err
		}
	}

	return &stats, nil
}

// CalculateAndApplyRewards is a convenience method that calculates and applies rewards
func (s *GamificationService) CalculateAndApplyRewards(ctx context.Context, userID string, wordCount int) (*db.UserStat, *Rewards, error) {
	rewards, err := s.CalculateRewards(ctx, userID, wordCount)
	if err != nil {
		return nil, nil, err
	}

	stats, err := s.ApplyRewards(ctx, userID, rewards)
	if err != nil {
		return nil, nil, err
	}

	return stats, rewards, nil
}

// CalculateMessageReward calculates rewards for a single message
// This is used for incremental rewards in the all-day journaling system
// Tinta Emas is calculated per message, Marmer/streak is only updated once per day
func (s *GamificationService) CalculateMessageReward(ctx context.Context, userID string, wordCount int) (*Rewards, error) {
	// Calculate Tinta Emas based on word count for this message
	// Every message gets a minimum of 1 Tinta Emas + bonus for longer messages
	tintaEmas := int32(0)
	if wordCount > 0 {
		// Base reward of 1 + word bonus (1 extra per TintaEmasPerWord words)
		tintaEmas = int32(1)
		if s.config.TintaEmasPerWord > 0 {
			tintaEmas += int32(wordCount / s.config.TintaEmasPerWord)
		}
	}

	// Get current user stats for streak calculation
	stats, err := s.queries.GetUserStats(ctx, userID)
	if err != nil {
		// User stats don't exist yet, create them
		stats, err = s.queries.CreateUserStats(ctx, userID)
		if err != nil {
			return nil, err
		}
	}

	// Check if this is the first message of the day (for streak/Marmer)
	today := time.Now().UTC().Truncate(24 * time.Hour)
	var marmer int32 = 0
	var newStreak int32 = stats.CurrentStreak
	streakUpdated := false

	if stats.LastActiveDate.Valid {
		lastActive := stats.LastActiveDate.Time
		daysSinceActive := int(today.Sub(lastActive).Hours() / 24)

		switch {
		case daysSinceActive == 0:
			// Already active today - no streak change, no Marmer (already given)
			newStreak = stats.CurrentStreak
		case daysSinceActive == 1:
			// First message of new day, consecutive day - streak continues!
			newStreak = stats.CurrentStreak + 1
			streakUpdated = true
			// Calculate Marmer with streak bonus
			marmer = int32(s.config.MarmerBaseReward)
			if s.config.MarmerStreakDivisor > 0 {
				marmer += newStreak / int32(s.config.MarmerStreakDivisor)
			}
		default:
			// Streak broken - reset to 1
			newStreak = 1
			streakUpdated = true
			marmer = int32(s.config.MarmerBaseReward)
		}
	} else {
		// First time user, start streak at 1
		newStreak = 1
		streakUpdated = true
		marmer = int32(s.config.MarmerBaseReward)
	}

	return &Rewards{
		TintaEmas:     tintaEmas,
		Marmer:        marmer,
		StreakUpdated: streakUpdated,
		NewStreak:     newStreak,
	}, nil
}

// CountWords counts words in text (simple implementation)
func CountWords(text string) int {
	if text == "" {
		return 0
	}

	wordCount := 0
	inWord := false

	for _, r := range text {
		isSpace := r == ' ' || r == '\t' || r == '\n' || r == '\r'
		if isSpace {
			if inWord {
				wordCount++
				inWord = false
			}
		} else {
			inWord = true
		}
	}

	// Don't forget the last word if text doesn't end with whitespace
	if inWord {
		wordCount++
	}

	return wordCount
}

// AddSessionReward adds the earned golden ink to a session
func (s *GamificationService) AddSessionReward(ctx context.Context, sessionID pgtype.UUID, tintaEmas int32) (db.Session, error) {
	return s.queries.AddSessionGoldenInk(ctx, db.AddSessionGoldenInkParams{
		ID:              sessionID,
		GoldenInkEarned: tintaEmas,
	})
}
