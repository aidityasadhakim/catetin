// Package ai provides AI integration for the application
package ai

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

const (
	openRouterBaseURL = "https://openrouter.ai/api/v1/chat/completions"
	defaultModel      = "google/gemini-2.5-flash-lite"
	fallbackModel     = "google/gemini-2.5-flash"
	appReferer        = "https://catetin.aidityas.me"
	appTitle          = "Catetin Aidityas"
)

// Client wraps the OpenRouter client for AI interactions
type Client struct {
	apiKey     string
	model      string
	httpClient *http.Client
}

// ClientConfig holds configuration for the AI client
type ClientConfig struct {
	APIKey string
	Model  string // defaults to "google/gemini-2.5-flash-lite"
}

// NewClient creates a new AI client with the given configuration
func NewClient(ctx context.Context, cfg ClientConfig) (*Client, error) {
	if cfg.APIKey == "" {
		return nil, fmt.Errorf("API key is required")
	}

	model := cfg.Model
	if model == "" {
		model = defaultModel
	}

	return &Client{
		apiKey: cfg.APIKey,
		model:  model,
		httpClient: &http.Client{
			Timeout: 60 * time.Second,
		},
	}, nil
}

// ChatMessage represents a message in the chat completion request
type ChatMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

// JSONSchema represents the JSON schema for structured outputs
type JSONSchema struct {
	Name   string                 `json:"name"`
	Strict bool                   `json:"strict"`
	Schema map[string]interface{} `json:"schema"`
}

// ResponseFormat represents the response format configuration
type ResponseFormat struct {
	Type       string      `json:"type"`
	JSONSchema *JSONSchema `json:"json_schema,omitempty"`
}

// ChatCompletionRequest represents the request to OpenRouter API
type ChatCompletionRequest struct {
	Model          string          `json:"model"`
	Messages       []ChatMessage   `json:"messages"`
	ResponseFormat *ResponseFormat `json:"response_format,omitempty"`
	Route          string          `json:"route,omitempty"`
}

// ChatCompletionChoice represents a choice in the response
type ChatCompletionChoice struct {
	Index   int `json:"index"`
	Message struct {
		Role    string `json:"role"`
		Content string `json:"content"`
	} `json:"message"`
	FinishReason string `json:"finish_reason"`
}

// ChatCompletionResponse represents the response from OpenRouter API
type ChatCompletionResponse struct {
	ID      string                 `json:"id"`
	Object  string                 `json:"object"`
	Created int64                  `json:"created"`
	Model   string                 `json:"model"`
	Choices []ChatCompletionChoice `json:"choices"`
	Usage   struct {
		PromptTokens     int `json:"prompt_tokens"`
		CompletionTokens int `json:"completion_tokens"`
		TotalTokens      int `json:"total_tokens"`
	} `json:"usage"`
	Error *struct {
		Message string `json:"message"`
		Type    string `json:"type"`
		Code    string `json:"code"`
	} `json:"error,omitempty"`
}

// doRequest performs an HTTP request to OpenRouter API
func (c *Client) doRequest(ctx context.Context, req *ChatCompletionRequest) (*ChatCompletionResponse, error) {
	body, err := json.Marshal(req)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request: %w", err)
	}

	httpReq, err := http.NewRequestWithContext(ctx, "POST", openRouterBaseURL, bytes.NewReader(body))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Authorization", "Bearer "+c.apiKey)
	httpReq.Header.Set("HTTP-Referer", appReferer)
	httpReq.Header.Set("X-Title", appTitle)

	resp, err := c.httpClient.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	var result ChatCompletionResponse
	if err := json.Unmarshal(respBody, &result); err != nil {
		return nil, fmt.Errorf("failed to unmarshal response: %w (body: %s)", err, string(respBody))
	}

	if result.Error != nil {
		return nil, fmt.Errorf("API error: %s (type: %s, code: %s)", result.Error.Message, result.Error.Type, result.Error.Code)
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("unexpected status code: %d (body: %s)", resp.StatusCode, string(respBody))
	}

	return &result, nil
}

// GenerateContent generates content using the AI model
func (c *Client) GenerateContent(ctx context.Context, prompt string) (string, error) {
	req := &ChatCompletionRequest{
		Model: c.model,
		Messages: []ChatMessage{
			{Role: "user", Content: prompt},
		},
		Route: "fallback",
	}

	// Try primary model first, then fallback
	resp, err := c.doRequest(ctx, req)
	if err != nil && c.model == defaultModel {
		// Try fallback model
		req.Model = fallbackModel
		resp, err = c.doRequest(ctx, req)
	}
	if err != nil {
		return "", fmt.Errorf("failed to generate content: %w", err)
	}

	if len(resp.Choices) == 0 {
		return "", fmt.Errorf("no choices in response")
	}

	return resp.Choices[0].Message.Content, nil
}

// GenerateContentWithSchema generates content with a specific JSON schema
func (c *Client) GenerateContentWithSchema(ctx context.Context, prompt string, schema map[string]interface{}) (string, error) {
	// Add additionalProperties: false to enforce strict schema
	schemaWithStrict := make(map[string]interface{})
	for k, v := range schema {
		schemaWithStrict[k] = v
	}
	schemaWithStrict["additionalProperties"] = false

	req := &ChatCompletionRequest{
		Model: c.model,
		Messages: []ChatMessage{
			{Role: "user", Content: prompt},
		},
		ResponseFormat: &ResponseFormat{
			Type: "json_schema",
			JSONSchema: &JSONSchema{
				Name:   "response",
				Strict: true,
				Schema: schemaWithStrict,
			},
		},
		Route: "fallback",
	}

	// Try primary model first, then fallback
	resp, err := c.doRequest(ctx, req)
	if err != nil && c.model == defaultModel {
		// Try fallback model
		req.Model = fallbackModel
		resp, err = c.doRequest(ctx, req)
	}
	if err != nil {
		return "", fmt.Errorf("failed to generate content with schema: %w", err)
	}

	if len(resp.Choices) == 0 {
		return "", fmt.Errorf("no choices in response")
	}

	return resp.Choices[0].Message.Content, nil
}

// GenerateContentWithMessages generates content with custom messages (for multi-turn conversations)
func (c *Client) GenerateContentWithMessages(ctx context.Context, messages []ChatMessage, schema map[string]interface{}) (string, error) {
	var responseFormat *ResponseFormat
	if schema != nil {
		schemaWithStrict := make(map[string]interface{})
		for k, v := range schema {
			schemaWithStrict[k] = v
		}
		schemaWithStrict["additionalProperties"] = false

		responseFormat = &ResponseFormat{
			Type: "json_schema",
			JSONSchema: &JSONSchema{
				Name:   "response",
				Strict: true,
				Schema: schemaWithStrict,
			},
		}
	}

	req := &ChatCompletionRequest{
		Model:          c.model,
		Messages:       messages,
		ResponseFormat: responseFormat,
		Route:          "fallback",
	}

	// Try primary model first, then fallback
	resp, err := c.doRequest(ctx, req)
	if err != nil && c.model == defaultModel {
		// Try fallback model
		req.Model = fallbackModel
		resp, err = c.doRequest(ctx, req)
	}
	if err != nil {
		return "", fmt.Errorf("failed to generate content: %w", err)
	}

	if len(resp.Choices) == 0 {
		return "", fmt.Errorf("no choices in response")
	}

	return resp.Choices[0].Message.Content, nil
}

// Model returns the model name being used
func (c *Client) Model() string {
	return c.model
}
