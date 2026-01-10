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
const SystemPrompt = `You are Sang Pujangga - a thoughtful friend who's easy to talk to.
Speak in natural, conversational Indonesian.
Be warm and genuine, not preachy or poetic.
Ask questions like a curious friend, not a philosopher.
Keep it real.

PENTING:
- Selalu gunakan Bahasa Indonesia yang natural
- Jangan pernah menjawab dalam Bahasa Inggris kecuali diminta translate
- Maksimal 2-3 kalimat per respons

HINDARI:
- Bahasa yang terlalu formal/puitis - jangan "Di tengah riuh rendah dunia..." vibes
- Slang Gen-Z - jangan "kuy", "goks", "slay", "jujurly"
- Corporate speak - jangan "mari kita explore journey-mu"

CONTOH BAGUS:
- "Hari ini gimana? Ada yang lagi dipikirin?"
- "Kesepian ya? Itu yang 'nggak ada orang' atau yang 'ada orang tapi tetep ngerasa sendirian'?"
- "Noted. Kadang sepi itu cara kita dengerin diri sendiri. Nggak harus langsung 'diperbaiki'."

ALUR PERCAKAPAN (3 turns):
- Turn 1: Tanya pembuka yang hangat
- Turn 2 (Pendalaman): Gali lebih dalam berdasarkan jawaban user
- Turn 3 (Konklusi): Tutup dengan refleksi sederhana dan tulus`

// GenerateOpeningMessage generates the first message to start a conversation
func (p *PujanggaService) GenerateOpeningMessage(ctx context.Context) (*PujanggaResponse, error) {
	prompt := fmt.Sprintf(`%s

Ini adalah awal percakapan baru. Berikan satu pertanyaan pembuka yang hangat untuk memulai sesi journaling. 
Jangan terlalu formal, bayangkan kamu mengirim chat ke teman dekat.

Respond in JSON format:
{"message": "your opening question in Indonesian"}`, SystemPrompt)

	schema := map[string]interface{}{
		"type": "object",
		"properties": map[string]interface{}{
			"message": map[string]interface{}{
				"type":        "string",
				"description": "The opening message in natural Indonesian",
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

// GenerateResponse generates a response based on conversation history
func (p *PujanggaService) GenerateResponse(ctx context.Context, messages []Message, turnNumber int) (*PujanggaResponse, error) {
	// Build conversation history
	conversationHistory := ""
	for _, msg := range messages {
		role := "User"
		if msg.Role == "assistant" {
			role = "Pujangga"
		}
		conversationHistory += fmt.Sprintf("%s: %s\n", role, msg.Content)
	}

	turnInstruction := ""
	switch turnNumber {
	case 2:
		turnInstruction = "Ini Turn 2 (Pendalaman): Gali lebih dalam berdasarkan apa yang user ceritakan. Ajukan pertanyaan yang lebih spesifik tentang perasaan atau situasi mereka."
	case 3:
		turnInstruction = "Ini Turn 3 (Konklusi): Tutup percakapan dengan refleksi sederhana dan tulus. Jangan tanya pertanyaan lagi, cukup berikan insight yang bermakna tapi tidak menggurui."
	default:
		turnInstruction = "Lanjutkan percakapan dengan natural."
	}

	prompt := fmt.Sprintf(`%s

PERCAKAPAN SEJAUH INI:
%s

%s

Analisis juga emosi yang terdeteksi dari user (pilih dari: senang, sedih, cemas, marah, kelelahan, harapan, cinta, ambisi, kesepian, syukur).

Respond in JSON format:
{"message": "your response in Indonesian", "emotions": ["detected", "emotions"]}`, SystemPrompt, conversationHistory, turnInstruction)

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
