// Package services provides business logic services
package services

import (
	"context"

	"catetin/backend/internal/db"
)

// LevelingService handles XP and level calculations
type LevelingService struct {
	queries *db.Queries
	config  LevelingConfig
}

// LevelingConfig holds configurable values for the leveling system
type LevelingConfig struct {
	// XPPerWord controls how many words are needed per 1 XP
	// Default: 10 words = 1 XP (same rate as Tinta Emas)
	XPPerWord int

	// BaseXPPerLevel is the base XP needed to level up
	// Formula: level * BaseXPPerLevel = XP needed for that level
	// Default: 100 (Level 2 needs 100 XP, Level 3 needs 200 XP, etc.)
	BaseXPPerLevel int
}

// DefaultLevelingConfig returns the default leveling configuration
func DefaultLevelingConfig() LevelingConfig {
	return LevelingConfig{
		XPPerWord:      10,  // 10 words = 1 XP
		BaseXPPerLevel: 100, // Progressive: level N requires N * 100 XP
	}
}

// NewLevelingService creates a new LevelingService
func NewLevelingService(queries *db.Queries, config *LevelingConfig) *LevelingService {
	cfg := DefaultLevelingConfig()
	if config != nil {
		cfg = *config
	}
	return &LevelingService{
		queries: queries,
		config:  cfg,
	}
}

// LevelReward represents the XP and level changes from an action
type LevelReward struct {
	XPEarned      int32 `json:"xp_earned"`
	CurrentXP     int32 `json:"current_xp"`
	TotalXP       int32 `json:"total_xp"`
	Level         int32 `json:"level"`
	LeveledUp     bool  `json:"leveled_up"`
	LevelsGained  int32 `json:"levels_gained"`
	XPToNextLevel int32 `json:"xp_to_next_level"`
}

// XPRequiredForLevel calculates the XP needed to reach a given level
// Uses progressive formula: level * BaseXPPerLevel
// Level 1 = 0 XP (starting level)
// Level 2 = 100 XP
// Level 3 = 200 XP
// Level 4 = 300 XP
// etc.
func (s *LevelingService) XPRequiredForLevel(level int32) int32 {
	if level <= 1 {
		return 0
	}
	return (level - 1) * int32(s.config.BaseXPPerLevel)
}

// XPToNextLevel calculates how much XP is needed to reach the next level
// from the current XP amount
func (s *LevelingService) XPToNextLevel(currentLevel, totalXP int32) int32 {
	nextLevelXP := s.XPRequiredForLevel(currentLevel + 1)
	currentLevelXP := s.XPRequiredForLevel(currentLevel)
	xpIntoCurrentLevel := totalXP - currentLevelXP
	xpNeededForNextLevel := nextLevelXP - currentLevelXP
	return xpNeededForNextLevel - xpIntoCurrentLevel
}

// CalculateLevelFromXP determines what level a user should be at given their total XP
func (s *LevelingService) CalculateLevelFromXP(totalXP int32) int32 {
	level := int32(1)
	for s.XPRequiredForLevel(level+1) <= totalXP {
		level++
	}
	return level
}

// CalculateXPFromWords calculates how much XP is earned from a word count
// Every message gets a minimum of 1 XP + bonus for longer messages
func (s *LevelingService) CalculateXPFromWords(wordCount int) int32 {
	if wordCount <= 0 {
		return 0
	}
	// Base reward of 1 XP + word bonus (1 extra per XPPerWord words)
	xp := int32(1)
	if s.config.XPPerWord > 0 {
		xp += int32(wordCount / s.config.XPPerWord)
	}
	return xp
}

// AwardXP adds XP to a user and handles level ups
func (s *LevelingService) AwardXP(ctx context.Context, userID string, wordCount int) (*LevelReward, error) {
	xpEarned := s.CalculateXPFromWords(wordCount)
	if xpEarned <= 0 {
		// No XP earned, just return current stats
		return s.GetCurrentLevel(ctx, userID)
	}

	// Get current stats (or create if doesn't exist)
	stats, err := s.queries.GetUserStats(ctx, userID)
	if err != nil {
		// Try to create user stats if they don't exist
		stats, err = s.queries.CreateUserStats(ctx, userID)
		if err != nil {
			return nil, err
		}
	}

	oldLevel := stats.Level

	// Add XP (this updates both current_xp and total_xp)
	stats, err = s.queries.AddXP(ctx, db.AddXPParams{
		UserID:    userID,
		CurrentXp: xpEarned,
	})
	if err != nil {
		return nil, err
	}

	// Calculate if we should level up based on new total XP
	newLevel := s.CalculateLevelFromXP(stats.TotalXp)
	leveledUp := newLevel > oldLevel
	levelsGained := int32(0)

	if leveledUp {
		levelsGained = newLevel - oldLevel
		// Update the level in the database
		stats, err = s.queries.UpdateLevel(ctx, db.UpdateLevelParams{
			UserID:    userID,
			Level:     newLevel,
			CurrentXp: stats.CurrentXp,
		})
		if err != nil {
			return nil, err
		}
	}

	return &LevelReward{
		XPEarned:      xpEarned,
		CurrentXP:     stats.CurrentXp,
		TotalXP:       stats.TotalXp,
		Level:         stats.Level,
		LeveledUp:     leveledUp,
		LevelsGained:  levelsGained,
		XPToNextLevel: s.XPToNextLevel(stats.Level, stats.TotalXp),
	}, nil
}

// GetCurrentLevel returns the current level info for a user
func (s *LevelingService) GetCurrentLevel(ctx context.Context, userID string) (*LevelReward, error) {
	levelInfo, err := s.queries.GetUserLevel(ctx, userID)
	if err != nil {
		// User doesn't exist yet, return default level 1
		return &LevelReward{
			XPEarned:      0,
			CurrentXP:     0,
			TotalXP:       0,
			Level:         1,
			LeveledUp:     false,
			LevelsGained:  0,
			XPToNextLevel: int32(s.config.BaseXPPerLevel),
		}, nil
	}

	return &LevelReward{
		XPEarned:      0,
		CurrentXP:     levelInfo.CurrentXp,
		TotalXP:       levelInfo.TotalXp,
		Level:         levelInfo.Level,
		LeveledUp:     false,
		LevelsGained:  0,
		XPToNextLevel: s.XPToNextLevel(levelInfo.Level, levelInfo.TotalXp),
	}, nil
}

// GetLevelProgress returns progress percentage towards next level (0-100)
func (s *LevelingService) GetLevelProgress(currentLevel, totalXP int32) int32 {
	currentLevelXP := s.XPRequiredForLevel(currentLevel)
	nextLevelXP := s.XPRequiredForLevel(currentLevel + 1)
	xpIntoLevel := totalXP - currentLevelXP
	xpNeededForLevel := nextLevelXP - currentLevelXP

	if xpNeededForLevel <= 0 {
		return 100
	}

	progress := (xpIntoLevel * 100) / xpNeededForLevel
	if progress > 100 {
		progress = 100
	}
	if progress < 0 {
		progress = 0
	}
	return progress
}
