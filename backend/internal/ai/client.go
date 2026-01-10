// Package ai provides AI integration for the application
package ai

import (
	"context"
	"fmt"

	"google.golang.org/genai"
)

// Client wraps the Gemini client for AI interactions
type Client struct {
	client *genai.Client
	model  string
}

// ClientConfig holds configuration for the AI client
type ClientConfig struct {
	APIKey string
	Model  string // defaults to "gemini-2.5-flash"
}

// NewClient creates a new AI client with the given configuration
func NewClient(ctx context.Context, cfg ClientConfig) (*Client, error) {
	if cfg.APIKey == "" {
		return nil, fmt.Errorf("API key is required")
	}

	client, err := genai.NewClient(ctx, &genai.ClientConfig{
		APIKey: cfg.APIKey,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create Gemini client: %w", err)
	}

	model := cfg.Model
	if model == "" {
		model = "gemini-2.5-flash"
	}

	return &Client{
		client: client,
		model:  model,
	}, nil
}

// GenerateContent generates content using the AI model
func (c *Client) GenerateContent(ctx context.Context, prompt string) (string, error) {
	response, err := c.client.Models.GenerateContent(ctx,
		c.model,
		genai.Text(prompt),
		nil,
	)
	if err != nil {
		return "", fmt.Errorf("failed to generate content: %w", err)
	}

	return response.Text(), nil
}

// GenerateContentWithSchema generates content with a specific JSON schema
func (c *Client) GenerateContentWithSchema(ctx context.Context, prompt string, schema map[string]interface{}) (string, error) {
	response, err := c.client.Models.GenerateContent(ctx,
		c.model,
		genai.Text(prompt),
		&genai.GenerateContentConfig{
			ResponseMIMEType:   "application/json",
			ResponseJsonSchema: schema,
		},
	)
	if err != nil {
		return "", fmt.Errorf("failed to generate content with schema: %w", err)
	}

	return response.Text(), nil
}

// GenerateContentWithConfig generates content with custom configuration
func (c *Client) GenerateContentWithConfig(ctx context.Context, prompt string, config *genai.GenerateContentConfig) (string, error) {
	response, err := c.client.Models.GenerateContent(ctx,
		c.model,
		genai.Text(prompt),
		config,
	)
	if err != nil {
		return "", fmt.Errorf("failed to generate content: %w", err)
	}

	return response.Text(), nil
}

// Model returns the model name being used
func (c *Client) Model() string {
	return c.model
}
