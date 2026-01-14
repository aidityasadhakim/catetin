# Feature Specification: Pricing & Weekly Summary

**Document Version:** 1.0  
**Status:** Approved  
**Author:** AI Assistant  
**Date:** January 2026

---

## 1. Executive Summary

This specification covers two interconnected features:

1. **Pricing System (Freemium Model)**: A two-tier system (Free/Paid) with Trakteer integration for payment processing
2. **Risalah Mingguan (Weekly Summary)**: AI-generated weekly emotional summaries available only to paid users

### Business Goals

- Monetize Catetin through a simple lifetime payment of **IDR 50,000** (10 Cendol on Trakteer)
- Encourage deeper engagement by gating advanced features behind the paid tier
- Create a sustainable revenue model while maintaining accessibility

---

## 2. Pricing Tiers

### 2.1 Free Plan

| Feature | Limit |
|---------|-------|
| Journal messages per session | **3 messages/day** |
| AI companion (Sang Pujangga) | Available |
| Gamification (Tinta Emas, Marmer) | Available |
| Galeri (Artwork Gallery) | Available |
| Risalah Mingguan (Weekly Summary) | **Not available** |

### 2.2 Paid Plan (Lifetime)

| Feature | Access |
|---------|--------|
| Journal messages per session | **Unlimited** |
| AI companion (Sang Pujangga) | Available |
| Gamification (Tinta Emas, Marmer) | Available |
| Galeri (Artwork Gallery) | Available |
| Risalah Mingguan (Weekly Summary) | **Available** |
| Future premium features | Included |

### 2.3 Pricing

- **Price**: IDR 50,000 (10 Cendol on Trakteer)
- **Type**: One-time lifetime payment
- **Payment Provider**: Trakteer (https://trakteer.id/aidityas_adhakim)
- **Refund Policy**: No refunds

---

## 3. User Flow

### 3.1 Free User Journey

```
User opens /refleksi
    ↓
System checks user subscription status
    ↓
User sends message 1 → AI responds
    ↓
User sends message 2 → AI responds
    ↓
User sends message 3 → AI responds
    ↓
User attempts message 4
    ↓
PAYWALL APPEARS (inside NotepadChat)
    ↓
"Kamu sudah mencapai batas harian (3 pesan).
 Upgrade ke Catetin Premium untuk refleksi tanpa batas!"
    ↓
[CTA: Upgrade Sekarang → /pricing]
```

### 3.2 Payment Flow

```
User visits /pricing
    ↓
Beautiful comparison of Free vs Paid
    ↓
User clicks "Upgrade Sekarang"
    ↓
Instructions displayed:
  1. "Klik tombol di bawah untuk membeli di Trakteer"
  2. "Di kolom pesan Trakteer, masukkan email kamu: [user's email shown]"
  3. "Setelah pembayaran, status akan terupdate otomatis dalam beberapa menit"
    ↓
User clicks → Opens https://trakteer.id/aidityas_adhakim
    ↓
User pays 10 Cendol (IDR 50k), includes email in message
    ↓
Trakteer sends webhook to our backend
    ↓
Webhook queued for processing
    ↓
Backend parses email from supporter_message
    ↓
Backend looks up Clerk user by email
    ↓
If found: User upgraded to paid plan (immediate effect)
If not found: Logged for manual review, user can report to support
    ↓
On next page load, user sees "Premium" badge and unlimited access
```

### 3.3 Email Not Found Flow

When the email in Trakteer message doesn't match any user:

```
Webhook received with email "typo@example.com"
    ↓
Clerk lookup fails (no user found)
    ↓
Log transaction to "pending_upgrades" or similar
    ↓
User doesn't see upgrade
    ↓
User contacts support email (from SUPPORT_EMAIL env)
    ↓
Admin manually upgrades user via database
```

### 3.4 Existing Users

- All existing users start as **free plan**
- No grandfathering - everyone must upgrade if they want premium features
- Users who upgrade mid-session get **immediate unlimited access**

---

## 4. Technical Specification

### 4.1 Database Migration

**File**: `backend/sql/migrations/008_create_user_subscriptions.sql`

```sql
-- +goose Up
-- +goose StatementBegin
CREATE TABLE IF NOT EXISTS user_subscriptions (
    user_id TEXT PRIMARY KEY,
    plan TEXT NOT NULL DEFAULT 'free',
    upgraded_at TIMESTAMPTZ,
    trakteer_transaction_id TEXT,
    trakteer_supporter_name TEXT,
    payment_amount INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_user_subscriptions_plan ON user_subscriptions(plan);

-- Pending upgrades for failed email lookups
CREATE TABLE IF NOT EXISTS pending_upgrades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trakteer_transaction_id TEXT UNIQUE NOT NULL,
    supporter_email TEXT NOT NULL,
    supporter_name TEXT NOT NULL,
    payment_amount INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    resolved_at TIMESTAMPTZ,
    resolved_user_id TEXT,
    error_message TEXT,
    raw_payload JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pending_upgrades_status ON pending_upgrades(status);
CREATE INDEX idx_pending_upgrades_email ON pending_upgrades(supporter_email);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE IF EXISTS pending_upgrades;
DROP TABLE IF EXISTS user_subscriptions;
-- +goose StatementEnd
```

### 4.2 New SQLC Queries

**File**: `backend/sql/queries/queries.sql` (append)

```sql
-- ==================== USER SUBSCRIPTIONS ====================

-- name: GetUserSubscription :one
SELECT * FROM user_subscriptions WHERE user_id = $1;

-- name: UpsertUserSubscription :one
INSERT INTO user_subscriptions (user_id, plan)
VALUES ($1, 'free')
ON CONFLICT (user_id) DO UPDATE SET updated_at = NOW()
RETURNING *;

-- name: UpgradeUserToPaid :one
UPDATE user_subscriptions
SET 
    plan = 'paid',
    upgraded_at = NOW(),
    trakteer_transaction_id = $2,
    trakteer_supporter_name = $3,
    payment_amount = $4,
    updated_at = NOW()
WHERE user_id = $1
RETURNING *;

-- name: CreateUserSubscriptionAsPaid :one
INSERT INTO user_subscriptions (user_id, plan, upgraded_at, trakteer_transaction_id, trakteer_supporter_name, payment_amount)
VALUES ($1, 'paid', NOW(), $2, $3, $4)
ON CONFLICT (user_id) DO UPDATE SET 
    plan = 'paid',
    upgraded_at = NOW(),
    trakteer_transaction_id = EXCLUDED.trakteer_transaction_id,
    trakteer_supporter_name = EXCLUDED.trakteer_supporter_name,
    payment_amount = EXCLUDED.payment_amount,
    updated_at = NOW()
RETURNING *;

-- name: CountTodayUserMessages :one
SELECT COUNT(*) FROM messages m
JOIN sessions s ON m.session_id = s.id
WHERE s.user_id = $1 
  AND m.role = 'user'
  AND s.started_at::date = CURRENT_DATE;

-- ==================== PENDING UPGRADES ====================

-- name: CreatePendingUpgrade :one
INSERT INTO pending_upgrades (trakteer_transaction_id, supporter_email, supporter_name, payment_amount, raw_payload, error_message)
VALUES ($1, $2, $3, $4, $5, $6)
ON CONFLICT (trakteer_transaction_id) DO NOTHING
RETURNING *;

-- name: GetPendingUpgrade :one
SELECT * FROM pending_upgrades WHERE id = $1;

-- name: ListPendingUpgrades :many
SELECT * FROM pending_upgrades 
WHERE status = 'pending'
ORDER BY created_at DESC;

-- name: ResolvePendingUpgrade :one
UPDATE pending_upgrades
SET status = 'resolved', resolved_at = NOW(), resolved_user_id = $2
WHERE id = $1
RETURNING *;

-- name: CheckTransactionProcessed :one
SELECT EXISTS(
    SELECT 1 FROM user_subscriptions WHERE trakteer_transaction_id = $1
    UNION
    SELECT 1 FROM pending_upgrades WHERE trakteer_transaction_id = $1
) as processed;
```

### 4.3 Environment Variables

Add to `.env`:

```bash
# Trakteer webhook configuration
TRAKTEER_WEBHOOK_TOKEN=your-secret-webhook-token

# Support email for payment issues
SUPPORT_EMAIL=support@catetin.app
```

### 4.4 Backend Endpoints

#### 4.4.1 Get User Subscription

**GET** `/api/subscription`

**Headers**: Requires Clerk JWT

**Response:**
```json
{
  "user_id": "clerk_user_id",
  "plan": "free",
  "upgraded_at": null,
  "messages_today": 2,
  "message_limit": 3,
  "can_send_message": true
}
```

For paid users:
```json
{
  "user_id": "clerk_user_id",
  "plan": "paid",
  "upgraded_at": "2026-01-14T10:30:00Z",
  "messages_today": 15,
  "message_limit": -1,
  "can_send_message": true
}
```

#### 4.4.2 Trakteer Webhook

**POST** `/api/webhooks/trakteer` (Public, no Clerk auth)

**Headers:**
- `X-Webhook-Token`: Trakteer webhook token for validation

**Request Body (from Trakteer):**
```json
{
  "created_at": "2026-01-14T10:30:00+07:00",
  "transaction_id": "TRK-123456",
  "type": "tip",
  "supporter_name": "John Doe",
  "supporter_avatar": "https://...",
  "supporter_message": "user@example.com",
  "unit": "Cendol",
  "unit_icon": "https://...",
  "quantity": 10,
  "price": 50000,
  "net_amount": 47500
}
```

**Processing Logic (Queue-based):**

1. Validate `X-Webhook-Token` header → Return 403 if invalid
2. Return 200 OK immediately (async processing)
3. Queue the webhook payload for background processing
4. In background worker:
   a. Check if `transaction_id` already processed (idempotency)
   b. Check `price >= 50000` (10 Cendol minimum)
   c. Extract and normalize email from `supporter_message`
   d. Query Clerk API to find user by email
   e. If user found → Create/update subscription as paid
   f. If user not found → Create pending_upgrade record
   g. Log all transactions for audit

**Response (immediate):**
```json
{
  "status": "queued",
  "message": "Webhook received and queued for processing"
}
```

#### 4.4.3 Modify Existing Respond Endpoint

**POST** `/api/sessions/:id/respond`

**New Logic (before generating AI response):**

```go
// 1. Get or create user subscription
sub, _ := queries.UpsertUserSubscription(ctx, userID)

// 2. If paid, allow unlimited
if sub.Plan == "paid" {
    // proceed normally
}

// 3. If free, check today's message count
count, _ := queries.CountTodayUserMessages(ctx, userID)

// 4. If limit reached, return error
if count >= 3 {
    return c.JSON(http.StatusForbidden, map[string]interface{}{
        "error":          "LIMIT_REACHED",
        "message":        "Kamu sudah mencapai batas harian (3 pesan). Upgrade untuk melanjutkan.",
        "upgrade_url":    "/pricing",
        "support_email":  config.SupportEmail,
        "messages_today": count,
        "message_limit":  3,
    })
}

// 5. Otherwise proceed normally
```

### 4.5 Webhook Queue Implementation

**File**: `backend/internal/services/webhook_queue.go`

Use a simple in-memory channel queue for MVP (can upgrade to Redis later):

```go
type WebhookProcessor struct {
    queue   chan TrakteerPayload
    queries *db.Queries
    clerk   *clerk.Client
}

func NewWebhookProcessor(queries *db.Queries, clerk *clerk.Client) *WebhookProcessor {
    wp := &WebhookProcessor{
        queue:   make(chan TrakteerPayload, 100),
        queries: queries,
        clerk:   clerk,
    }
    go wp.worker()
    return wp
}

func (wp *WebhookProcessor) Enqueue(payload TrakteerPayload) {
    wp.queue <- payload
}

func (wp *WebhookProcessor) worker() {
    for payload := range wp.queue {
        wp.processPayload(payload)
    }
}
```

### 4.6 Clerk Integration

**File**: `backend/internal/services/clerk.go`

```go
import (
    "github.com/clerk/clerk-sdk-go/v2"
    "github.com/clerk/clerk-sdk-go/v2/user"
)

func (s *ClerkService) FindUserByEmail(ctx context.Context, email string) (*clerk.User, error) {
    // Normalize email
    email = strings.ToLower(strings.TrimSpace(email))
    
    // List users with email filter
    params := &user.ListParams{}
    params.EmailAddresses = []string{email}
    
    users, err := user.List(ctx, params)
    if err != nil {
        return nil, fmt.Errorf("clerk list users: %w", err)
    }
    
    if len(users.Users) == 0 {
        return nil, ErrUserNotFound
    }
    
    return users.Users[0], nil
}
```

### 4.7 Frontend Components

#### 4.7.1 Subscription Hook

**File**: `frontend/src/hooks/useSubscription.ts`

```typescript
export interface SubscriptionStatus {
  user_id: string;
  plan: 'free' | 'paid';
  upgraded_at: string | null;
  messages_today: number;
  message_limit: number; // -1 for unlimited
  can_send_message: boolean;
}

export function useSubscription() {
  return useQuery({
    queryKey: apiKeys.subscription,
    queryFn: () => api.getSubscription(),
  });
}
```

#### 4.7.2 Paywall Component

**File**: `frontend/src/components/Paywall.tsx`

Display location: Inside `NotepadChat.tsx`, rendered after messages when limit reached

**Design Requirements:**
- Glassmorphism card with frosted background
- Gold border accent (var(--color-earth-gold))
- Cinzel Decorative for headline
- EB Garamond for body text
- Pill-shaped CTA button
- Support email displayed

**Copy (Indonesian):**
```
Refleksimu Hari Ini Sudah Selesai

Kamu telah menulis 3 pesan hari ini.
Upgrade ke Premium untuk refleksi tanpa batas
dan akses Risalah Mingguan.

[Upgrade Sekarang - Rp 50.000]
(Sekali bayar, selamanya)

Ada masalah pembayaran? Hubungi [support_email]
```

#### 4.7.3 Pricing Page

**Route**: `/pricing`

**Sections:**

1. **Hero Section**
   - Headline: "Jadikan Refleksi Lebih Dalam"
   - Subhead: "Satu kali bayar, akses selamanya"

2. **Comparison Table**
   | Fitur | Gratis | Premium |
   |-------|--------|---------|
   | Pesan per hari | 3 | Tanpa batas |
   | Sang Pujangga | ✓ | ✓ |
   | Gamifikasi | ✓ | ✓ |
   | Galeri | ✓ | ✓ |
   | Risalah Mingguan | ✗ | ✓ |

3. **How to Pay Section**
   - Step 1: "Klik tombol di bawah untuk membeli di Trakteer"
   - Step 2: "Di kolom pesan, masukkan email kamu:"
     - Display user's Clerk email
     - Copy button
   - Step 3: "Pilih 10 Cendol (Rp 50.000)"
   - Step 4: "Setelah pembayaran, status terupdate otomatis"
   - [Link to Trakteer: https://trakteer.id/aidityas_adhakim]

4. **FAQ Section**
   - "Berapa lama sampai status terupdate?" → "Biasanya dalam beberapa menit"
   - "Bagaimana jika email salah?" → "Hubungi [support_email]"
   - "Apakah ada refund?" → "Tidak ada kebijakan refund"

5. **Support Section**
   - "Ada masalah? Hubungi kami di [support_email]"

---

## 5. Weekly Summary (Risalah Mingguan)

### 5.1 Overview

The Risalah Mingguan is an AI-generated weekly emotional summary that provides insights into the user's journaling patterns. **Only available to paid users.**

### 5.2 Generation Trigger

- **When generated**: On-demand when user opens `/risalah` route
- **Week boundary**: Sunday 00:00 WIB (UTC+7) to Saturday 23:59 WIB
- **Logic**: When user opens Risalah page, check if summary exists for current/past week. If not, generate it.

```
User opens /risalah
    ↓
Check subscription → Must be paid
    ↓
Get latest week boundary (previous Sunday to Saturday)
    ↓
Check if summary exists for that week
    ↓
If not exists AND week has ended:
    → Generate summary via AI
    → Store in database
    ↓
Return summary to user
```

### 5.3 Week Calculation

```go
func GetWeekBoundaries(now time.Time) (start, end time.Time) {
    // Get the most recent Sunday (start of week)
    weekday := int(now.Weekday())
    daysToSunday := weekday
    if weekday == 0 {
        daysToSunday = 7 // If today is Sunday, get last Sunday
    }
    
    start = now.AddDate(0, 0, -daysToSunday)
    start = time.Date(start.Year(), start.Month(), start.Day(), 0, 0, 0, 0, start.Location())
    
    end = start.AddDate(0, 0, 6)
    end = time.Date(end.Year(), end.Month(), end.Day(), 23, 59, 59, 0, end.Location())
    
    return start, end
}
```

### 5.4 Summary Content

**Input to AI:**
- All user messages from the week (from `messages` table via `sessions`)
- Session timestamps
- Message count per day

**Output Structure (stored in `emotions` JSONB column):**
```json
{
  "dominant_emotion": "contemplative",
  "secondary_emotions": ["hopeful", "anxious"],
  "trend": "improving",
  "insights": [
    "Kamu menulis paling banyak di hari Rabu",
    "Tema keluarga muncul 3 kali minggu ini"
  ],
  "encouragement": "Refleksi yang dalam! Terus jaga kebiasaan ini."
}
```

### 5.5 AI Prompt for Summary

```
Kamu adalah Sang Pujangga, pendamping refleksi di Catetin.

Berdasarkan jurnal pengguna minggu ini, buatlah "Surat Masa Lalu" - 
ringkasan emosional singkat yang hangat dan bermakna.

Jurnal minggu ini:
---
{all_user_messages_concatenated}
---

Total sesi: {session_count}
Total pesan: {message_count}

Berikan output dalam format JSON:
{
  "summary": "Ringkasan 2-3 kalimat tentang minggu ini dalam bahasa Indonesia yang hangat",
  "dominant_emotion": "emosi utama (satu kata)",
  "secondary_emotions": ["emosi lain", "maksimal 3"],
  "trend": "improving/stable/challenging",
  "insights": ["insight spesifik 1", "insight spesifik 2"],
  "encouragement": "Kata penyemangat singkat 1 kalimat"
}

Aturan:
- Gunakan bahasa Indonesia yang santai tapi bermakna
- Hindari klise dan bahasa yang terlalu puitis
- Insights harus spesifik berdasarkan konten jurnal
- Jika tidak ada jurnal minggu ini, buat ringkasan yang encouraging untuk mulai menulis
```

### 5.6 New SQLC Queries for Weekly Summary

Already exists in `queries.sql`:
- `CreateWeeklySummary`
- `GetWeeklySummary`
- `ListWeeklySummaries`

Add:
```sql
-- name: GetLatestWeeklySummary :one
SELECT * FROM weekly_summaries
WHERE user_id = $1
ORDER BY week_start DESC
LIMIT 1;

-- name: GetWeekMessages :many
SELECT m.content, m.created_at, s.started_at
FROM messages m
JOIN sessions s ON m.session_id = s.id
WHERE s.user_id = $1
  AND m.role = 'user'
  AND s.started_at >= $2
  AND s.started_at <= $3
ORDER BY m.created_at ASC;

-- name: CountWeekSessions :one
SELECT COUNT(DISTINCT s.id) as session_count, COUNT(m.id) as message_count
FROM sessions s
LEFT JOIN messages m ON m.session_id = s.id AND m.role = 'user'
WHERE s.user_id = $1
  AND s.started_at >= $2
  AND s.started_at <= $3;
```

### 5.7 Backend Endpoints

#### 5.7.1 List Weekly Summaries

**GET** `/api/summaries`

**Query Params:**
- `limit` (default: 10)
- `offset` (default: 0)

**Response:**
```json
{
  "summaries": [
    {
      "id": "uuid",
      "week_start": "2026-01-05",
      "week_end": "2026-01-11",
      "summary": "Minggu ini kamu banyak merenung tentang...",
      "session_count": 5,
      "message_count": 12,
      "emotions": {
        "dominant_emotion": "contemplative",
        "secondary_emotions": ["hopeful"],
        "trend": "improving",
        "insights": ["..."],
        "encouragement": "..."
      },
      "created_at": "2026-01-12T00:05:00Z"
    }
  ],
  "total": 4
}
```

**Access Control:**
- Check subscription status
- If `plan != 'paid'`, return 403:
```json
{
  "error": "PREMIUM_REQUIRED",
  "message": "Risalah Mingguan hanya tersedia untuk pengguna Premium",
  "upgrade_url": "/pricing"
}
```

#### 5.7.2 Get Latest Summary (with auto-generation)

**GET** `/api/summaries/latest`

**Logic:**
1. Check subscription (must be paid)
2. Calculate last completed week boundaries
3. Check if summary exists for that week
4. If not exists and week has at least 1 session:
   - Fetch week's messages
   - Generate summary via AI
   - Store in database
5. Return summary

**Response:**
Same as single summary object, or:
```json
{
  "summary": null,
  "message": "Belum ada jurnal minggu lalu. Mulai menulis untuk mendapatkan Risalah Mingguan!"
}
```

### 5.8 Frontend Route

**Route**: `/risalah`

**States:**

1. **Loading State**
   - Skeleton with letter/scroll shape
   - "Memuat Risalah..."

2. **Free User (Locked)**
   - Beautiful teaser showing blurred summary
   - Lock icon overlay
   - CTA: "Upgrade untuk membuka Risalah Mingguan"
   - Link to /pricing

3. **Paid User - No Summaries Yet**
   - Encouraging message
   - "Belum ada Risalah. Mulai menulis di Refleksi untuk mendapatkan ringkasan mingguanmu!"
   - Link to /refleksi

4. **Paid User - With Summaries**
   - Latest summary prominently displayed
   - Timeline of past summaries below
   - Each summary as a "letter" card

**Design:**
- Scroll/letter aesthetic
- Aged paper texture effect
- Wax seal decorative element
- Cinzel Decorative for dates
- EB Garamond for summary text

---

## 6. Admin & Manual Overrides

### 6.1 Manual Plan Change via Database

```sql
-- Upgrade user manually
UPDATE user_subscriptions 
SET plan = 'paid', upgraded_at = NOW(), updated_at = NOW()
WHERE user_id = 'clerk_user_id_here';

-- If user doesn't exist in subscriptions table yet
INSERT INTO user_subscriptions (user_id, plan, upgraded_at)
VALUES ('clerk_user_id_here', 'paid', NOW());

-- Resolve a pending upgrade manually
UPDATE pending_upgrades 
SET status = 'resolved', resolved_at = NOW(), resolved_user_id = 'clerk_user_id_here'
WHERE id = 'pending_upgrade_uuid';
```

### 6.2 Viewing Pending Upgrades

```sql
-- List all unresolved pending upgrades
SELECT id, supporter_email, supporter_name, payment_amount, created_at
FROM pending_upgrades
WHERE status = 'pending'
ORDER BY created_at DESC;
```

---

## 7. Security Considerations

### 7.1 Webhook Security

1. **Token Validation**: All Trakteer webhooks must include valid `X-Webhook-Token` header matching `TRAKTEER_WEBHOOK_TOKEN` env var
2. **Idempotency**: Store `transaction_id` to prevent duplicate processing via `CheckTransactionProcessed` query
3. **Immediate 200 Response**: Return success immediately to prevent Trakteer retries, process async
4. **Logging**: Log all webhook payloads to `pending_upgrades.raw_payload` for audit

### 7.2 Email Handling

1. **Normalize Email**: `strings.ToLower(strings.TrimSpace(email))`
2. **Extract from Message**: Handle case where user includes extra text with email
3. **Validation**: Basic email format check before Clerk lookup

```go
func ExtractEmail(message string) string {
    // Try to find email pattern in the message
    emailRegex := regexp.MustCompile(`[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}`)
    matches := emailRegex.FindStringSubmatch(message)
    if len(matches) > 0 {
        return strings.ToLower(strings.TrimSpace(matches[0]))
    }
    // Fallback: treat entire message as email
    return strings.ToLower(strings.TrimSpace(message))
}
```

### 7.3 Plan Enforcement

1. **Server-side Only**: Never trust frontend for plan checks
2. **Database Source of Truth**: Always check `user_subscriptions` table
3. **Upsert Pattern**: Use `UpsertUserSubscription` to ensure record exists before checking

---

## 8. Implementation Tasks

### Phase 1: Database & Backend Foundation
- [ ] Create migration `008_create_user_subscriptions.sql`
- [ ] Add SQLC queries for subscription management
- [ ] Add SQLC queries for pending upgrades
- [ ] Run `make sqlc` to generate Go code
- [ ] Add new env vars to config

### Phase 2: Subscription API
- [ ] Implement `GET /api/subscription` handler
- [ ] Implement `UpsertUserSubscription` on first access
- [ ] Add subscription check to `Respond` handler
- [ ] Return proper 403 error when limit reached

### Phase 3: Trakteer Webhook
- [ ] Create webhook queue service
- [ ] Implement Clerk email lookup service
- [ ] Implement `POST /api/webhooks/trakteer` handler
- [ ] Add idempotency check
- [ ] Handle user not found → pending_upgrades

### Phase 4: Frontend Paywall
- [ ] Create `useSubscription` hook
- [ ] Create `Paywall` component
- [ ] Integrate paywall into `NotepadChat`
- [ ] Handle 403 error in `useAIRespond`

### Phase 5: Pricing Page
- [ ] Create `/pricing` route
- [ ] Build comparison table component
- [ ] Add payment instructions with user email
- [ ] Link to Trakteer page
- [ ] Add support email display

### Phase 6: Weekly Summary Backend
- [ ] Add new SQLC queries for week data
- [ ] Implement week boundary calculation
- [ ] Implement summary generation service
- [ ] Create AI prompt for summary
- [ ] Implement `GET /api/summaries` with plan check
- [ ] Implement `GET /api/summaries/latest` with auto-generation

### Phase 7: Weekly Summary Frontend
- [ ] Create `/risalah` route
- [ ] Create summary card component (letter aesthetic)
- [ ] Create locked state for free users
- [ ] Create empty state for no summaries
- [ ] Add timeline view for past summaries

### Phase 8: Testing & Polish
- [ ] Test Trakteer webhook with ngrok locally
- [ ] Test duplicate webhook handling
- [ ] Test email extraction edge cases
- [ ] Test plan enforcement on all endpoints
- [ ] Add loading states throughout
- [ ] Add error handling and user feedback

---

## 9. Trakteer Configuration

### 9.1 Webhook Setup in Trakteer Dashboard

1. Go to Trakteer Creator Dashboard → Settings → Webhook
2. Add webhook URL: `https://your-domain.com/api/webhooks/trakteer`
3. Generate and copy webhook token
4. Add token to `.env` as `TRAKTEER_WEBHOOK_TOKEN`

### 9.2 Trakteer Page Instructions for Users

Tell users to:
1. Visit https://trakteer.id/aidityas_adhakim
2. Select "10 Cendol" (Rp 50.000)
3. In the message field, enter their email exactly as registered
4. Complete payment
5. Wait a few minutes for status to update

---

## 10. Appendix

### A. Trakteer Webhook Payload Reference

```typescript
interface TrakteerWebhookPayload {
  created_at: string;       // ISO 8601: "2026-01-14T10:30:00+07:00"
  transaction_id: string;   // Unique: "TRK-123456"
  type: "tip";              // Event type
  supporter_name: string;   // Trakteer display name
  supporter_avatar: string; // Avatar URL
  supporter_message: string; // Where user puts their email
  media: object;            // Media share (unused)
  unit: string;             // "Cendol"
  unit_icon: string;        // Unit icon URL
  quantity: number;         // Number of units (should be 10)
  price: number;            // Total in IDR (should be >= 50000)
  net_amount: number;       // After Trakteer fees (~95%)
}
```

### B. Trakteer Fees

- Platform fee: 5%
- Payment gateway: varies (0.77% - 3.4%)
- For IDR 50,000: receive approximately IDR 45,000 - 47,500

### C. Error Codes

| Code | HTTP | Description |
|------|------|-------------|
| `LIMIT_REACHED` | 403 | Free user exceeded 3 messages/day |
| `PREMIUM_REQUIRED` | 403 | Feature requires paid plan |
| `INVALID_WEBHOOK_TOKEN` | 403 | Webhook token mismatch |
| `INVALID_PAYLOAD` | 400 | Webhook payload malformed |

### D. Environment Variables Summary

```bash
# Existing
CLERK_SECRET_KEY=sk_...
DATABASE_URL=postgres://...
OPENROUTER_API_KEY=...

# New for this feature
TRAKTEER_WEBHOOK_TOKEN=your-webhook-token-from-trakteer
SUPPORT_EMAIL=support@catetin.app
```
