// Package ai provides AI integration for the application
package ai

import (
	"context"
	"encoding/json"
	"fmt"

	"google.golang.org/genai"
)

// PujanggaService handles conversations with Sang Pujangga AI companion
type PujanggaService struct {
	client *Client
}

// NewPujanggaService creates a new Pujangga service
func NewPujanggaService(client *Client) *PujanggaService {
	return &PujanggaService{
		client: client,
	}
}

// Message represents a conversation message
type Message struct {
	Role    string `json:"role"` // "user" or "assistant"
	Content string `json:"content"`
}

// PujanggaResponse represents the AI's response
type PujanggaResponse struct {
	Message        string   `json:"message"`
	Emotions       []string `json:"emotions,omitempty"`
	ConversationID string   `json:"conversation_id,omitempty"`
}

// SystemPrompt is the core personality configuration for Sang Pujangga
const SystemPrompt = `You are Sang Pujangga - a writing prompt generator for a journaling app.
Your goal is to help users reflect on their day through simple, thoughtful writing prompts.

STYLE:
- DO NOT be conversational. You are NOT a chat bot.
- Your response must strictly follow this format: "Brief Acknowledgment. Question/Prompt?"
- Example: "Aku dengar. Apa yang membuatmu merasa begitu?"
- Example: "Berat juga ya. Bagian mana yang paling mengganggu pikiranmu?"
- Keep it short. Max 2 sentences total.

LANGUAGE:
- Natural Indonesian (id-ID).
- Warm but concise.
- No slang, no poetic flowery language, no corporate speak.

DEPTH RULES:
The conversation has depth levels. Adjust your prompts based on the current level.

LEVEL 1 - SURFACE (messages 1-2):
- Very simple prompts answering "What/How".
- Focus on facts/events.

LEVEL 2 - LIGHT (messages 3-5):
- Follow-up prompts answering "Why".
- Focus on feelings/reactions.

LEVEL 3 - DEEP (messages 6+):
- Reflective prompts answering "Meaning/Impact".
- Focus on insights/values.

TOPIC RULES:
- Check the last 3 messages.
- If the SAME specific topic/aspect of life has been discussed 3 times in a row, SWITCH to a new topic.
- New topic examples: health, relationships, work, self-care, dreams.
- Transition naturally: "Ngomong-ngomong, gimana soal kesehatanmu hari ini?"`

// DepthLevel represents the conversation depth
type DepthLevel int

const (
	DepthSurface DepthLevel = 1 // Messages 1-2
	DepthLight   DepthLevel = 2 // Messages 3-5
	DepthDeep    DepthLevel = 3 // Messages 6+
)

// CalculateDepth determines conversation depth based on message count
func CalculateDepth(userMessageCount int) DepthLevel {
	switch {
	case userMessageCount <= 2:
		return DepthSurface
	case userMessageCount <= 5:
		return DepthLight
	default:
		return DepthDeep
	}
}

// DepthName returns the Indonesian name for a depth level
func DepthName(depth DepthLevel) string {
	switch depth {
	case DepthSurface:
		return "Permukaan"
	case DepthLight:
		return "Ringan"
	case DepthDeep:
		return "Dalam"
	default:
		return "Permukaan"
	}
}

// GenerateOpeningMessage generates the first message to start a conversation
func (p *PujanggaService) GenerateOpeningMessage(ctx context.Context) (*PujanggaResponse, error) {
	prompt := fmt.Sprintf(`%s

Ini adalah awal percakapan baru (LEVEL 1 - PERMUKAAN).
Berikan SATU pertanyaan pembuka yang SANGAT SEDERHANA - bisa dijawab dengan 1 kata saja.

Contoh pertanyaan yang bagus:
- "Hari ini gimana?"
- "Mood-nya apa?"
- "Lagi sibuk nggak?"

Jangan terlalu formal, bayangkan kamu mengirim chat ke teman dekat.

Respond in JSON format:
{"message": "your simple opening question in Indonesian"}`, SystemPrompt)

	schema := map[string]interface{}{
		"type": "object",
		"properties": map[string]interface{}{
			"message": map[string]interface{}{
				"type":        "string",
				"description": "A simple opening question that can be answered in one word",
			},
		},
		"required": []string{"message"},
	}

	responseText, err := p.client.GenerateContentWithSchema(ctx, prompt, schema)
	if err != nil {
		return nil, fmt.Errorf("failed to generate opening message: %w", err)
	}

	var response PujanggaResponse
	if err := json.Unmarshal([]byte(responseText), &response); err != nil {
		return nil, fmt.Errorf("failed to parse response: %w", err)
	}

	return &response, nil
}

// GenerateResponse generates a response based on recent conversation context
// recentMessages should contain only the last 3 messages for context efficiency
// userMessageCount is the total number of user messages in the session (for depth calculation)
func (p *PujanggaService) GenerateResponse(ctx context.Context, recentMessages []Message, userMessageCount int) (*PujanggaResponse, error) {
	// Calculate depth based on total user messages
	depth := CalculateDepth(userMessageCount)
	depthName := DepthName(depth)

	// Build conversation history from recent messages only
	conversationHistory := ""
	for _, msg := range recentMessages {
		role := "User"
		if msg.Role == "assistant" {
			role = "Pujangga"
		}
		conversationHistory += fmt.Sprintf("%s: %s\n", role, msg.Content)
	}

	// Get depth-specific instruction
	depthInstruction := getDepthInstruction(depth)

	prompt := fmt.Sprintf(`%s

KONTEKS PERCAKAPAN (3 pesan terakhir):
%s

INFO SESI:
- Total pesan user: %d
- Level kedalaman: %d (%s)

%s

Analisis juga emosi yang terdeteksi dari user (pilih dari: senang, sedih, cemas, marah, kelelahan, harapan, cinta, ambisi, kesepian, syukur).

Respond in JSON format:
{"message": "your response in Indonesian", "emotions": ["detected", "emotions"]}`,
		SystemPrompt,
		conversationHistory,
		userMessageCount,
		depth,
		depthName,
		depthInstruction)

	schema := map[string]interface{}{
		"type": "object",
		"properties": map[string]interface{}{
			"message": map[string]interface{}{
				"type":        "string",
				"description": "The response message in natural Indonesian",
			},
			"emotions": map[string]interface{}{
				"type": "array",
				"items": map[string]interface{}{
					"type": "string",
				},
				"description": "Detected emotions from user's messages",
			},
		},
		"required": []string{"message", "emotions"},
	}

	responseText, err := p.client.GenerateContentWithSchema(ctx, prompt, schema)
	if err != nil {
		return nil, fmt.Errorf("failed to generate response: %w", err)
	}

	var response PujanggaResponse
	if err := json.Unmarshal([]byte(responseText), &response); err != nil {
		return nil, fmt.Errorf("failed to parse response: %w", err)
	}

	return &response, nil
}

// getDepthInstruction returns the instruction for a specific depth level
func getDepthInstruction(depth DepthLevel) string {
	switch depth {
	case DepthSurface:
		return `INSTRUKSI (LEVEL 1 - SURFACE):
- Ini awal sesi menulis.
- Berikan prompt SEDERHANA tentang fakta/kejadian.
- Format: "Acknowledgment singkat. Pertanyaan apa/gimana?"
- Contoh: "Oke. Apa satu hal yang paling kamu ingat hari ini?"`
	case DepthLight:
		return `INSTRUKSI (LEVEL 2 - LIGHT):
- User mulai menulis.
- Berikan prompt tentang PERASAAN/REAKSI.
- Format: "Acknowledgment singkat. Kenapa begitu/apa rasanya?"
- Contoh: "Paham. Kenapa hal itu bikin kamu merasa begitu?"`
	case DepthDeep:
		return `INSTRUKSI (LEVEL 3 - DEEP):
- User sudah menulis banyak.
- Berikan prompt REFLEKTIF tentang MAKNA/VALUE.
- Format: "Acknowledgment singkat. Apa maknanya/pelajarannya?"
- Contoh: "Menarik. Kalau dipikir lagi, apa yang situasi ini ajarkan ke kamu?"`
	default:
		return ""
	}
}

// GenerateWeeklySummary generates a weekly emotional summary (Risalah Mingguan)
func (p *PujanggaService) GenerateWeeklySummary(ctx context.Context, weekMessages []Message) (string, error) {
	// Compile all user messages from the week
	userMessages := ""
	for _, msg := range weekMessages {
		if msg.Role == "user" {
			userMessages += msg.Content + "\n---\n"
		}
	}

	if userMessages == "" {
		return "Minggu ini kamu belum sempat nulis. Nggak apa-apa, kadang memang butuh jeda. Semoga minggu depan lebih ringan ya.", nil
	}

	prompt := fmt.Sprintf(`%s

Kamu diminta membuat "Risalah Mingguan" - ringkasan emosional dari jurnal user selama seminggu.
Ini bukan analisis psikologis formal, tapi lebih seperti surat dari teman yang sudah mendengarkan cerita-cerita mereka.

CATATAN USER MINGGU INI:
%s

Buat ringkasan dalam format "Surat Masa Lalu" - maksimal 3-4 kalimat yang:
1. Menyebutkan tema emosional utama minggu ini
2. Memberikan perspektif atau validasi yang hangat
3. Tidak menggurui atau terlalu filosofis

Respond in JSON format:
{"summary": "your weekly summary in Indonesian"}`, SystemPrompt, userMessages)

	schema := map[string]interface{}{
		"type": "object",
		"properties": map[string]interface{}{
			"summary": map[string]interface{}{
				"type":        "string",
				"description": "The weekly summary in natural Indonesian",
			},
		},
		"required": []string{"summary"},
	}

	responseText, err := p.client.GenerateContentWithSchema(ctx, prompt, schema)
	if err != nil {
		return "", fmt.Errorf("failed to generate weekly summary: %w", err)
	}

	var response struct {
		Summary string `json:"summary"`
	}
	if err := json.Unmarshal([]byte(responseText), &response); err != nil {
		return "", fmt.Errorf("failed to parse response: %w", err)
	}

	return response.Summary, nil
}

// ChatConfig returns the chat configuration with system instructions
func (p *PujanggaService) ChatConfig() *genai.GenerateContentConfig {
	return &genai.GenerateContentConfig{
		SystemInstruction: &genai.Content{
			Parts: []*genai.Part{
				genai.NewPartFromText(SystemPrompt),
			},
		},
	}
}
