# Catetin - AI Agent Guidelines

## Project Overview

Catetin is a journaling application with:
- Go/Echo backend with PostgreSQL
- React/TanStack frontend with Clerk auth

### Product Vision (from PRD)
Catetin transforms journaling into art creation. Users reflect with an AI companion ("Sang Pujangga"), earn resources based on depth of reflection, and progressively reveal classical artwork in their personal gallery.

**Core Loop:** Refleksi → Persembahan → Mahakarya (Reflection → Offering → Masterpiece)

### AI Companion: Sang Pujangga
- **Persona:** A wise friend, not a philosopher
- **Tone:** Casual but meaningful - like texting a thoughtful friend
- **Language:** Natural Indonesian (id-ID) - no slang, no overly formal/poetic language
- **Avoid:** "Di tengah riuh rendah dunia..." vibes, Gen-Z slang, corporate speak

### Key Features (MVP)
- AI-guided journaling sessions (3-turn conversation)
- Gamification: Tinta Emas (word count) + Marmer (streaks)
- Galeri: Progressive art reveal system
- Risalah Mingguan: Weekly emotional summary

## Architecture Patterns

### Backend
- Echo web framework with middleware chain
- SQLC for type-safe database queries
- Clerk JWT authentication
- Layered architecture: handlers → services → db

### Frontend
- TanStack Router (file-based routing)
- TanStack Query for server state
- Clerk for authentication
- API client in `src/lib/api.ts`

## Key Files

### Backend
- `cmd/server/main.go` - Application entry point
- `internal/config/config.go` - Environment configuration
- `internal/middleware/auth.go` - Clerk JWT validation
- `internal/routes/routes.go` - Route registration
- `internal/handlers/handlers.go` - HTTP handlers
- `sql/queries/queries.sql` - SQLC query definitions

### Frontend
- `src/main.tsx` - Application entry
- `src/routes/__root.tsx` - Root layout with providers
- `src/lib/api.ts` - API client with auth token handling
- `src/integrations/clerk/` - Clerk provider setup

## Development Commands

```bash
make dev          # Start all services
make db-migrate   # Run database migrations
make sqlc         # Generate SQLC code
make db-shell     # Connect to PostgreSQL
```

## Gemini AI Integration

### Client Setup

```go
import "google.golang.org/genai"

// Initialize client with API key
geminiClient, err := genai.NewClient(context.Background(), &genai.ClientConfig{
    APIKey: os.Getenv("GEMINI_API_KEY"),
})
if err != nil {
    log.Fatal("Failed to create Gemini client:", err)
}
```

### Structured JSON Output

Use `ResponseJsonSchema` to enforce structured responses:

```go
// Define schema for structured output
quizSchema := map[string]interface{}{
    "type": "object",
    "properties": map[string]interface{}{
        "question": map[string]interface{}{
            "type":        "string",
            "description": "The quiz question",
        },
        "options": map[string]interface{}{
            "type": "array",
            "items": map[string]interface{}{
                "type": "string",
            },
            "minItems":    4,
            "maxItems":    4,
            "description": "Four answer options",
        },
        "correctAnswer": map[string]interface{}{
            "type":        "integer",
            "minimum":     0,
            "maximum":     3,
            "description": "Index of the correct answer (0-3)",
        },
    },
    "required": []string{"question", "options", "correctAnswer"},
}

// Generate content with schema
response, err := geminiClient.Models.GenerateContent(ctx,
    "gemini-2.5-flash",
    genai.Text("Your prompt here"),
    &genai.GenerateContentConfig{
        ResponseMIMEType:   "application/json",
        ResponseJsonSchema: quizSchema,
    },
)

// Parse response into struct
var result MyStruct
if err := json.Unmarshal([]byte(response.Text()), &result); err != nil {
    return err
}
```

### Key Patterns

- **Model:** Use `gemini-2.5-flash` for fast responses
- **JSON Mode:** Set `ResponseMIMEType: "application/json"` + `ResponseJsonSchema` for structured output
- **Context:** Pass request context for cancellation: `c.Request().Context()`
- **Error Handling:** Check both API errors and JSON parsing errors

## Adding New Features

1. Add migration in `backend/sql/migrations/`
2. Add queries in `backend/sql/queries/queries.sql`
3. Run `make sqlc` to generate Go code
4. Add handler in `backend/internal/handlers/`
5. Register route in `backend/internal/routes/routes.go`
6. Add frontend hook in `frontend/src/hooks/`
7. Create component/route in `frontend/src/`

## Landing the Plane (Session Completion)

**When ending a work session**, you MUST complete ALL steps below. Work is NOT complete until `git push` succeeds.

**MANDATORY WORKFLOW:**

1. **File issues for remaining work** - Create issues for anything that needs follow-up
2. **Run quality gates** (if code changed) - Tests, linters, builds
3. **Update issue status** - Close finished work, update in-progress items
4. **PUSH TO REMOTE** - This is MANDATORY:
   ```bash
   git pull --rebase
   bd sync
   git push
   git status  # MUST show "up to date with origin"
   ```
5. **Clean up** - Clear stashes, prune remote branches
6. **Verify** - All changes committed AND pushed
7. **Hand off** - Provide context for next session

**CRITICAL RULES:**
- Work is NOT complete until `git push` succeeds
- NEVER stop before pushing - that leaves work stranded locally
- NEVER say "ready to push when you are" - YOU must push
- If push fails, resolve and retry until it succeeds

## Frontend Design Guidelines

Reference `styles.json` for the complete design system. Key principles:

### Design Philosophy
**Avoid "AI Slop" at all costs:**
- NO purple/blue gradients on white backgrounds
- NO generic fonts (Inter, Roboto, Arial, SF Pro, Open Sans, system-ui)
- NO predictable hero-CTA-features-testimonials templates
- NO generic geometric shapes or abstract blobs
- NO stock-looking imagery or clichéd visuals

### Typography
- **Headlines:** Cinzel (serif, elegant) - for titles and section headers
- **Body:** Lora (serif, literary) - for readable content
- **Mono:** JetBrains Mono - for stats, labels, metadata
- **Accent:** Merriweather - for quotes and special text
- Never use Inter, Roboto, or system fonts

### Color Usage
- **Light mode:** Cream (#F5F0E8) backgrounds, not pure white
- **Dark mode:** Deep navy (#0F1729) backgrounds, not pure black
- **Text:** Charcoal (#1A1A1A) for headlines, muted (#6B6B6B) for body - never pure black
- **Accent:** Gold (#D4A84B) and Coral (#E86B4A) used sparingly for emphasis

### Motion Design
1. **Page Load:** Orchestrated reveal sequence with staggered delays (0ms → 200ms → 400ms)
2. **Scroll:** Fade-in-up with Intersection Observer - `translateY(20px)` → `translateY(0)`
3. **Hover:** Subtle scale transforms (1 → 1.02), color transitions
4. **Interactive:** Micro-interactions on all clickable elements
5. **Ambient:** Subtle background motion for ethereal elements

### Technical Requirements
- Mobile-first with fluid typography: `clamp(1rem, 2.5vw, 1.25rem)`
- CSS custom properties with `--catetin-` prefix
- Smooth scroll behavior
- Semantic HTML5 structure
- No heavy animation libraries - use CSS transitions/keyframes
- Lazy load images, critical CSS inline
- `font-display: swap` for web fonts

### Component Patterns
- **Cards:** Use parchment texture for journaling content
- **Buttons:** Rounded corners (1rem), clear hover states
- **Decorative borders:** Double-line style for Renaissance feel
- **Data displays:** Use mono font for numbers and stats

