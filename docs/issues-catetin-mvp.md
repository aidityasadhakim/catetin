# Catetin MVP Issues

## Epic: Foundation & User Stats
type: epic
priority: 0
labels: backend, frontend, mvp

The infrastructure layer that everything else depends on. Establishes patterns for API handlers, TanStack Query hooks, and the first visible user feature (stats dashboard).

---

## Implement User Stats API endpoints
type: feature
priority: 1
labels: backend, api
deps: 

Implement GET and UPSERT endpoints for user stats (golden_ink, marble, current_streak, longest_streak).

### Acceptance Criteria
- GET /api/stats returns user stats (creates if not exists)
- Stats include: golden_ink, marble, current_streak, longest_streak, updated_at
- Uses existing SQLC queries (UpsertUserStats, GetUserStats)
- Returns 401 if not authenticated

---

## Create TanStack Query hooks pattern
type: task
priority: 1
labels: frontend, patterns
deps: 

Set up `frontend/src/hooks/` directory with `useUserStats` as the template for all future hooks.

### Acceptance Criteria
- Create `frontend/src/hooks/useUserStats.ts`
- Use TanStack Query with proper query keys from api.ts
- Add query key to apiKeys in api.ts
- Export typed hook with loading/error states
- Document the pattern in a comment for future hooks

---

## Build Dashboard route with Renaissance aesthetic
type: feature
priority: 2
labels: frontend, ui
deps: Implement User Stats API endpoints, Create TanStack Query hooks pattern

Create `/dashboard` route showing user stats with the classical/Renaissance design system.

### Acceptance Criteria
- Route at `/dashboard` (protected, requires auth)
- Shows: Tinta Emas (golden_ink), Marmer (marble), streak info
- Uses Cinzel font for headers, Lora for body
- Cream background (#F5F0E8), gold accents (#D4A84B)
- Responsive layout (mobile-first)
- Loading and error states

---

## Epic: Journaling Sessions
type: epic
priority: 0
labels: backend, frontend, core
deps: Epic: Foundation & User Stats

The core journaling loop: starting sessions, storing messages, and the 3-turn AI conversation flow.

---

## Implement Sessions API (CRUD)
type: feature
priority: 1
labels: backend, api

Implement session management endpoints for journaling sessions.

### Acceptance Criteria
- POST /api/sessions - Create new session
- GET /api/sessions - List user sessions (paginated)
- GET /api/sessions/:id - Get session with messages
- PUT /api/sessions/:id - Update session (end session, add summary)
- Uses existing SQLC queries
- Sessions are user-scoped (can only see own sessions)

---

## Implement Messages API
type: feature
priority: 1
labels: backend, api
deps: Implement Sessions API (CRUD)

Implement message storage for session conversations.

### Acceptance Criteria
- POST /api/sessions/:id/messages - Create message
- GET /api/sessions/:id/messages - List messages for session
- Messages have: role (user/assistant), content, turn_number
- Validates session belongs to user
- Orders messages by created_at

---

## Create useSession and useMessages hooks
type: task
priority: 1
labels: frontend, hooks
deps: Implement Sessions API (CRUD), Implement Messages API

Create TanStack Query hooks for session and message management.

### Acceptance Criteria
- `useCreateSession` - mutation to start new session
- `useSessions` - query to list sessions
- `useSession(id)` - query single session with messages
- `useSendMessage` - mutation to add message
- Proper query invalidation on mutations

---

## Build Journal Interface route
type: feature
priority: 1
labels: frontend, ui, core
deps: Create useSession and useMessages hooks

Create `/refleksi` route with the chat-style journaling interface.

### Acceptance Criteria
- Route at `/refleksi` (protected)
- "Mulai Menulis" button starts new session
- Chat-style UI showing user and AI messages
- Input area for user responses
- Turn indicator (Turn 1/2/3)
- Session ends after 3 turns with celebratory animation
- Renaissance aesthetic (parchment texture, classical typography)

---

## Epic: AI Integration - Sang Pujangga
type: epic
priority: 0
labels: backend, ai, core
deps: Epic: Journaling Sessions

The AI companion that guides journaling. Implements the 3-turn conversation with emotional depth.

---

## Set up OpenAI/Gemini integration
type: task
priority: 1
labels: backend, ai, infrastructure

Configure AI provider integration for Sang Pujangga responses.

### Acceptance Criteria
- Add AI provider config (OPENAI_API_KEY or GEMINI_API_KEY)
- Create `internal/ai/` package for AI interactions
- Abstract interface to support multiple providers
- Handle rate limiting and errors gracefully

---

## Implement Sang Pujangga system prompt
type: feature
priority: 1
labels: backend, ai
deps: Set up OpenAI/Gemini integration

Create the system prompt and conversation logic for Sang Pujangga.

### Acceptance Criteria
- System prompt in natural Indonesian (not poetic, not Gen-Z slang)
- Persona: wise friend who's easy to talk to
- Turn 1: Warm opening question
- Turn 2: Dig deeper based on user response
- Turn 3: Gentle closing reflection
- Detects emotional keywords and responds appropriately

---

## Create AI response endpoint
type: feature
priority: 1
labels: backend, api, ai
deps: Implement Sang Pujangga system prompt, Implement Messages API

Endpoint that generates AI response and stores it as a message.

### Acceptance Criteria
- POST /api/sessions/:id/respond - Generate AI response
- Takes conversation history, returns AI message
- Stores both user message and AI response
- Tracks turn number (1, 2, or 3)
- On turn 3: triggers gamification reward calculation

---

## Connect Journal UI to AI endpoint
type: task
priority: 2
labels: frontend, ai
deps: Create AI response endpoint, Build Journal Interface route

Wire up the journal interface to use real AI responses.

### Acceptance Criteria
- User message triggers AI response endpoint
- Show typing indicator while AI responds
- Display AI response in chat
- Handle errors gracefully (show retry option)
- Streaming response if supported

---

## Epic: Gamification & Rewards
type: epic
priority: 0
labels: backend, frontend, gamification
deps: Epic: AI Integration - Sang Pujangga

The reward system: earning Tinta Emas (golden ink) and Marmer (marble) based on reflection depth.

---

## Implement reward calculation service
type: feature
priority: 1
labels: backend, gamification

Calculate rewards based on journal entry content.

### Acceptance Criteria
- Create `internal/services/gamification.go`
- Tinta Emas: Based on word count (configurable rate)
- Marmer: Based on streak continuation
- Update streak logic (increment or reset)
- Store rewards when session ends

---

## Create reward animation component
type: feature
priority: 2
labels: frontend, ui, gamification
deps: Implement reward calculation service

Celebratory animation when session ends and rewards are given.

### Acceptance Criteria
- Golden light fill animation (per PRD)
- Shows Tinta Emas and Marmer earned
- Smooth transition to gallery teaser
- Uses Framer Motion for animations
- Sound effect (optional, can be toggled)

---

## Update Dashboard with live gamification
type: task
priority: 2
labels: frontend, ui
deps: Implement reward calculation service, Build Dashboard route with Renaissance aesthetic

Enhance dashboard to show real-time gamification progress.

### Acceptance Criteria
- Real-time update after journal session
- Progress bars for resources
- Streak calendar/visualization
- Historical stats view

---

## Epic: Galeri (Artwork Gallery)
type: epic
priority: 0
labels: backend, frontend, core
deps: Epic: Gamification & Rewards

The progressive art reveal system where users spend resources to unveil classical artwork.

---

## Implement Artworks API
type: feature
priority: 1
labels: backend, api

Endpoints for artwork catalog and user progress.

### Acceptance Criteria
- GET /api/artworks - List available artworks
- GET /api/artworks/:id - Get artwork details
- GET /api/user/artworks - Get user's artwork progress
- POST /api/user/artworks/:id/reveal - Spend resources to reveal more
- Uses existing SQLC queries

---

## Create useArtworks hooks
type: task
priority: 1
labels: frontend, hooks
deps: Implement Artworks API

TanStack Query hooks for artwork gallery.

### Acceptance Criteria
- `useArtworks` - list all artworks
- `useUserArtworks` - user's collection with progress
- `useRevealArtwork` - mutation to spend resources
- Optimistic updates for reveal action

---

## Build Gallery route with progressive reveal
type: feature
priority: 1
labels: frontend, ui, core
deps: Create useArtworks hooks

Create `/galeri` route with the artwork collection view.

### Acceptance Criteria
- Route at `/galeri` (protected)
- Grid of artwork cards showing reveal percentage
- Click to view artwork detail
- Reveal animation (stone → statue, or painting restoration)
- Shows cost to reveal next portion
- Locked artworks shown as silhouettes

---

## Seed initial artwork catalog
type: task
priority: 2
labels: backend, data
deps: Implement Artworks API

Add initial set of classical artworks to the database.

### Acceptance Criteria
- Create migration or seed script
- 3-5 initial artworks (Renaissance/Classical theme)
- Include: name, description, image_url, total_segments
- First artwork unlocked by default

---

## Epic: Risalah Mingguan (Weekly Summary)
type: epic
priority: 1
labels: backend, frontend, ai
deps: Epic: AI Integration - Sang Pujangga

AI-generated weekly emotional summary - the "Surat Masa Lalu" (Letter from the Past).

---

## Implement weekly summary generation
type: feature
priority: 2
labels: backend, ai

Background job to generate weekly emotional summary.

### Acceptance Criteria
- Runs on Sunday (or triggered manually)
- Aggregates week's journal entries
- AI generates "Surat Masa Lalu" in Indonesian
- Stores in weekly_summaries table
- Handles users with no entries that week

---

## Implement Weekly Summary API
type: feature
priority: 2
labels: backend, api
deps: Implement weekly summary generation

Endpoints for weekly summaries.

### Acceptance Criteria
- GET /api/summaries - List user's weekly summaries
- GET /api/summaries/:id - Get specific summary
- GET /api/summaries/latest - Get most recent summary

---

## Build Risalah route
type: feature
priority: 2
labels: frontend, ui
deps: Implement Weekly Summary API

Create `/risalah` route for viewing weekly summaries.

### Acceptance Criteria
- Route at `/risalah` (protected)
- List of past weekly summaries
- Detail view with "Surat Masa Lalu" content
- Timeline or calendar view of emotional arc
- Renaissance letter/scroll aesthetic

---

## Epic: Polish & Launch Prep
type: epic
priority: 1
labels: frontend, backend, polish
deps: Epic: Galeri (Artwork Gallery), Epic: Risalah Mingguan (Weekly Summary)

Final polish, error handling, and launch preparation.

---

## Add loading skeletons across app
type: task
priority: 2
labels: frontend, ui

Consistent loading states throughout the application.

### Acceptance Criteria
- Skeleton components for cards, lists, text
- Applied to Dashboard, Gallery, Journal, Risalah
- Matches Renaissance aesthetic

---

## Implement error boundaries and fallbacks
type: task
priority: 2
labels: frontend, ui

Graceful error handling throughout the app.

### Acceptance Criteria
- React error boundaries at route level
- Friendly error messages in Indonesian
- Retry options where appropriate
- Log errors for debugging

---

## Add ambient animations
type: task
priority: 3
labels: frontend, ui, polish

Subtle background animations for ethereal feel.

### Acceptance Criteria
- Gentle particle effects or light rays
- Performance optimized (requestAnimationFrame)
- Can be disabled in settings
- Enhances Renaissance/divine aesthetic

---

## Implement onboarding flow
type: feature
priority: 2
labels: frontend, ui

First-time user experience explaining the app.

### Acceptance Criteria
- Triggered on first login
- Explains: Sang Pujangga, Tinta Emas, Marmer, Galeri
- Visual walkthrough with Renaissance aesthetic
- Skip option for returning users
- Sets up initial artwork

---

## Add navigation and routing polish
type: task
priority: 2
labels: frontend, ui

Consistent navigation throughout the app.

### Acceptance Criteria
- Navigation bar with: Beranda, Refleksi, Galeri, Risalah, Jejak (stats)
- Active state indicators
- Mobile-responsive menu
- Smooth page transitions
