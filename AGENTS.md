# Catetin - AI Agent Guidelines

## Project Overview

Catetin is a journaling application with:
- Go/Echo backend with PostgreSQL
- React/TanStack frontend with Clerk auth

### Product Vision (from PRD)
Catetin transforms journaling into art creation. Users reflect with an AI companion, earn resources based on depth of reflection, and progressively reveal classical artwork in their personal gallery.

**Core Loop:** Refleksi → Persembahan → Mahakarya (Reflection → Offering → Masterpiece)

### AI Companion
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

## OpenRouter AI Integration

The application uses OpenRouter API for AI model access, providing access to multiple AI providers through a unified API.

### Environment Variable

```bash
OPENROUTER_API_KEY=your-openrouter-api-key
```

### Client Setup

```go
import "catetin/backend/internal/ai"

// Initialize client with API key
aiClient, err := ai.NewClient(ctx, ai.ClientConfig{
    APIKey: os.Getenv("OPENROUTER_API_KEY"),
})
if err != nil {
    log.Fatal("Failed to create AI client:", err)
}
```

### Structured JSON Output

Use `GenerateContentWithSchema` to enforce structured responses:

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
responseText, err := aiClient.GenerateContentWithSchema(ctx, "Your prompt here", quizSchema)
if err != nil {
    return err
}

// Parse response into struct
var result MyStruct
if err := json.Unmarshal([]byte(responseText), &result); err != nil {
    return err
}
```

### Key Patterns

- **Primary Model:** `google/gemini-2.5-flash-lite` (fast, cost-effective)
- **Fallback Model:** `google/gemini-2.5-flash` (more capable, used if primary fails)
- **JSON Mode:** Use `GenerateContentWithSchema` for structured output
- **App Attribution:** Requests include HTTP-Referer and X-Title headers for OpenRouter leaderboards
- **Error Handling:** Client automatically retries with fallback model on failure

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

### Design Philosophy (Pixel Renaissance)
**A fusion of 8-bit nostalgia and Renaissance grandeur.**
- **Imagery:** Lush, pixel-art landscapes (gardens, skies) and classical statues.
- **Atmosphere:** Ethereal, timeless, vibrant yet grounded.
- **Anti-patterns (Strict):**
    - NO purple/blue gradients on white
    - NO generic fonts (Inter, Roboto, Arial, SF Pro, Open Sans, system-ui)
    - NO hero-CTA-features-testimonials templates
    - NO abstract blobs or generic geometric shapes
    - NO pure black or pure white
    - NO gradient backgrounds everywhere
    - NO same border-radius on everything
    - NO shadows on every card
    - NO perfect symmetry without purpose

### Typography
- **Headlines:** `UnifrakturMaguntia` (Blackletter) - Commanding, ornate, Gothic. Use for Hero text.
- **Subheadings:** `Cinzel Decorative` - Elegant, Roman-inspired.
- **Body:** `EB Garamond` - Classic, academic, highly readable serif.
- **UI Elements:** `Cinzel` - Clean serif for buttons, navigation, and labels.
- **Mono:** `JetBrains Mono` - For technical details.

### Color Palette (Orion Inspired)
- **Nature:** Vibrant Sky Blue (`#5CABEB`), Deep Forest Green (`#31572C`).
- **Earth:** Golden Path (`#E9C46A`), Stone Gray (`#D6D6D6`).
- **UI:** Cream/Beige backgrounds (`#F9F9F4`) with dark green text.

### Visual Elements
- **Dithering:** Use pixel-art dithering textures for backgrounds or image treatments.
- **Statuary:** Classical statues as focal points.
- **Flora:** Overgrown, lush greenery framing the content.
- **Glass:** Frosted glass elements for UI cards to float above the rich background.
- **Pills:** Rounded "pill" shaped buttons for primary actions.

### Motion
- **Parallax:** Gentle floating movement for cloud/sky layers.
- **Reveal:** Text should fade in with a slight upward drift.
- **Hover:** Buttons should have a "glint" or subtle scale effect.

Use beads for issues tracker, see bd --help for more info
