// Package config provides environment configuration for the application
package config

import (
	"os"
)

// Config holds all configuration for the application
type Config struct {
	DatabaseURL          string
	BackendPort          string
	BackendHost          string
	ClerkSecretKey       string
	OpenRouterAPIKey     string
	TrakteerWebhookToken string
	SupportEmail         string
}

// Load returns a new Config with values from environment variables
func Load() *Config {
	return &Config{
		DatabaseURL:          getEnv("DATABASE_URL", "postgres://catetin:catetin_secret@localhost:5432/catetin_db?sslmode=disable"),
		BackendPort:          getEnv("BACKEND_PORT", "8080"),
		BackendHost:          getEnv("BACKEND_HOST", "0.0.0.0"),
		ClerkSecretKey:       getEnv("CLERK_SECRET_KEY", ""),
		OpenRouterAPIKey:     getEnv("OPENROUTER_API_KEY", ""),
		TrakteerWebhookToken: getEnv("TRAKTEER_WEBHOOK_TOKEN", ""),
		SupportEmail:         getEnv("SUPPORT_EMAIL", "support@catetin.app"),
	}
}

// getEnv returns the value of an environment variable or a default value
func getEnv(key, defaultValue string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return defaultValue
}
