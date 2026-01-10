# Catetin MVP - Parallel Session Handoff

## Project Context

**Catetin** is a journaling app that transforms writing into art creation. Users reflect with an AI companion ("Sang Pujangga"), earn resources (Tinta Emas, Marmer), and progressively reveal classical artwork.

- **Stack**: Go/Echo backend, React/TanStack frontend, PostgreSQL, Clerk auth
- **Language**: Indonesian (id-ID) - casual but meaningful tone
- **Aesthetic**: Renaissance/Classical ("Modern Classic")

## Current State

- ✅ Database schema complete (6 migrations)
- ✅ SQLC queries defined for all tables
- ✅ Backend structure with Clerk auth middleware
- ✅ Frontend with landing page, Clerk, TanStack Query
- ❌ All API handlers are stubs
- ❌ No frontend routes beyond landing page

## Issue Tracker

Using `bd` (beads) for issue tracking. Key commands:
```bash
bd ready          # Show work with no blockers
bd show <id>      # Show issue details
bd list           # List all issues
bd close <id>     # Close when done
```

---

## Parallel Work Streams

### Stream A: Backend APIs (catetin-ati, catetin-7yu, catetin-yqw)

**Goal**: Implement the core API endpoints using existing SQLC queries.

**Files to modify**:
- `backend/internal/handlers/handlers.go` - Add handler methods
- `backend/internal/routes/routes.go` - Register routes

**Pattern** (from existing code):
```go
// Handler method pattern
func (h *Handler) GetUserStats(c echo.Context) error {
    userID, err := middleware.RequireUserID(c)
    if err != nil {
        return err
    }
    
    stats, err := h.queries.UpsertUserStats(c.Request().Context(), userID)
    if err != nil {
        return echo.NewHTTPError(http.StatusInternalServerError, "failed to get stats")
    }
    
    return c.JSON(http.StatusOK, stats)
}
```

**Issues**:
- `catetin-ati`: User Stats API (GET /api/stats)
- `catetin-7yu`: Sessions API (CRUD for /api/sessions)
- `catetin-yqw`: Artworks API (/api/artworks, /api/user/artworks)

---

### Stream B: Frontend Hooks (catetin-lob)

**Goal**: Create TanStack Query hooks pattern in `frontend/src/hooks/`

**Files to create**:
- `frontend/src/hooks/useUserStats.ts`
- `frontend/src/hooks/index.ts` (barrel export)

**Pattern**:
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useApiClient, apiKeys } from '../lib/api'

export function useUserStats() {
  const api = useApiClient()
  
  return useQuery({
    queryKey: apiKeys.stats(),
    queryFn: async () => {
      const { data, error } = await api.get<UserStats>('/stats')
      if (error) throw new Error(error)
      return data
    },
  })
}
```

**Add to `frontend/src/lib/api.ts`**:
```typescript
// Add to apiKeys
stats: () => [...apiKeys.all, 'stats'] as const,
sessions: () => [...apiKeys.all, 'sessions'] as const,
// etc.
```

---

### Stream C: AI Integration (catetin-2nj)

**Goal**: Set up Gemini integration for Sang Pujangga

**Reference implementation** (user provided):
```go
import "google.golang.org/genai"

geminiClient, err := genai.NewClient(context.Background(), &genai.ClientConfig{
    APIKey: geminiApiKey,
})

response, err := geminiClient.Models.GenerateContent(ctx,
    "gemini-2.5-flash",
    genai.Text(prompt),
    &genai.GenerateContentConfig{
        ResponseMIMEType: "application/json",
        ResponseJsonSchema: schema,
    },
)
```

**Files to create**:
- `backend/internal/ai/client.go` - Gemini client wrapper
- `backend/internal/ai/pujangga.go` - Sang Pujangga conversation logic

**Config to add** (`backend/internal/config/config.go`):
```go
GeminiAPIKey string // from GEMINI_API_KEY env var
```

**System Prompt for Sang Pujangga**:
```
You are Sang Pujangga - a thoughtful friend who's easy to talk to.
Speak in natural, conversational Indonesian.
Be warm and genuine, not preachy or poetic.
Ask questions like a curious friend, not a philosopher.
Keep it real.

AVOID:
- Overly formal language ("Di tengah riuh rendah dunia...")
- Gen-Z slang ("kuy", "goks", "slay")
- Corporate speak ("mari kita explore journey-mu")

GOOD EXAMPLES:
- "Hari ini gimana? Ada yang lagi dipikirin?"
- "Kesepian ya? Itu yang 'nggak ada orang' atau yang 'ada orang tapi tetep ngerasa sendirian'?"
```

---

### Stream D: Gamification Service (catetin-6ut)

**Goal**: Calculate rewards based on journal content

**Files to create**:
- `backend/internal/services/gamification.go`

**Logic**:
```go
type GamificationService struct {
    queries *db.Queries
}

// CalculateRewards determines Tinta Emas and Marmer earned
func (s *GamificationService) CalculateRewards(ctx context.Context, userID string, wordCount int) (*Rewards, error) {
    // Tinta Emas: 1 per 10 words (configurable)
    tintaEmas := wordCount / 10
    
    // Get current stats for streak calculation
    stats, _ := s.queries.GetUserStats(ctx, userID)
    
    // Marmer: Based on streak continuation
    marmer := 0
    if isStreakContinued(stats) {
        marmer = 1 // Or more based on streak length
    }
    
    return &Rewards{TintaEmas: tintaEmas, Marmer: marmer}, nil
}
```

---

## Artwork Progressive Reveal (Recommendation)

For the gallery feature, here's how to implement progressive reveal:

**Database** (already exists in `005_create_user_artworks.sql`):
```sql
user_artworks (
    user_id,
    artwork_id,
    reveal_percentage INT DEFAULT 0,  -- 0-100
    segments_revealed INT DEFAULT 0
)
```

**Frontend approach**:
1. **CSS Mask/Clip-path**: Divide image into grid segments
2. **Progressive loading**: Use blur-to-sharp or grayscale-to-color
3. **Canvas-based**: Draw revealed portions only

**Recommended: Segment-based reveal**
```tsx
// Divide artwork into N segments (e.g., 20)
// reveal_percentage determines how many segments are visible
// Each segment can be a CSS grid cell with opacity transition

const segments = Array.from({ length: TOTAL_SEGMENTS }, (_, i) => ({
  id: i,
  revealed: i < revealedCount,
}))
```

**Free Classical Art Sources**:
- Wikimedia Commons (public domain)
- Metropolitan Museum Open Access
- Rijksmuseum (Dutch masters)

---

## Commands Reference

```bash
# Development
make dev           # Start all services
make db-migrate    # Run migrations
make sqlc          # Generate Go code from SQL

# Issue tracking
bd ready           # What can I work on?
bd show catetin-X  # Issue details
bd close catetin-X # Mark done
bd dep add A B     # A depends on B
```

---

## Session Assignment Template

Copy this for each parallel session:

```
I'm working on Catetin - a journaling app. Read docs/PRD.md and AGENTS.md for context.

My assigned issue: [ISSUE_ID]
Run `bd show [ISSUE_ID]` to see full details.

Key files:
- [list relevant files from stream above]

When done:
1. Test the implementation
2. Run `bd close [ISSUE_ID]`
3. Note any blockers or follow-up issues
```

---

## Suggested Session Splits

**Session 1 - Backend APIs**:
```
Working on catetin-ati (User Stats API) and catetin-7yu (Sessions API).
These are backend features in backend/internal/handlers/.
See docs/PARALLEL-SESSION-PROMPT.md Stream A for patterns.
```

**Session 2 - AI + Gamification**:
```
Working on catetin-2nj (Gemini setup) and catetin-6ut (Gamification service).
Create backend/internal/ai/ and backend/internal/services/.
See docs/PARALLEL-SESSION-PROMPT.md Stream C and D.
```

**Session 3 - Frontend Hooks**:
```
Working on catetin-lob (TanStack Query hooks pattern).
Create frontend/src/hooks/ directory with useUserStats as template.
See docs/PARALLEL-SESSION-PROMPT.md Stream B.
```
