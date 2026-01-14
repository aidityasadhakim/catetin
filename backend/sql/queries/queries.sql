-- ==================== USER STATS ====================

-- name: GetUserStats :one
SELECT * FROM user_stats WHERE user_id = $1;

-- name: CreateUserStats :one
INSERT INTO user_stats (user_id)
VALUES ($1)
RETURNING *;

-- name: UpsertUserStats :one
INSERT INTO user_stats (user_id)
VALUES ($1)
ON CONFLICT (user_id) DO UPDATE SET updated_at = NOW()
RETURNING *;

-- name: AddGoldenInk :one
UPDATE user_stats
SET golden_ink = golden_ink + $2, updated_at = NOW()
WHERE user_id = $1
RETURNING *;

-- name: AddMarble :one
UPDATE user_stats
SET marble = marble + $2, updated_at = NOW()
WHERE user_id = $1
RETURNING *;

-- name: SpendGoldenInk :one
UPDATE user_stats
SET golden_ink = golden_ink - $2, updated_at = NOW()
WHERE user_id = $1 AND golden_ink >= $2
RETURNING *;

-- name: SpendMarble :one
UPDATE user_stats
SET marble = marble - $2, updated_at = NOW()
WHERE user_id = $1 AND marble >= $2
RETURNING *;

-- name: UpdateStreak :one
UPDATE user_stats
SET 
    current_streak = $2,
    longest_streak = GREATEST(longest_streak, $2),
    last_active_date = $3,
    updated_at = NOW()
WHERE user_id = $1
RETURNING *;

-- name: AddXP :one
UPDATE user_stats
SET 
    current_xp = current_xp + $2,
    total_xp = total_xp + $2,
    updated_at = NOW()
WHERE user_id = $1
RETURNING *;

-- name: UpdateLevel :one
UPDATE user_stats
SET 
    level = $2,
    current_xp = $3,
    updated_at = NOW()
WHERE user_id = $1
RETURNING *;

-- name: GetUserLevel :one
SELECT level, current_xp, total_xp FROM user_stats
WHERE user_id = $1;

-- ==================== SESSIONS ====================

-- name: CreateSession :one
INSERT INTO sessions (user_id)
VALUES ($1)
RETURNING *;

-- name: GetSessionByID :one
SELECT * FROM sessions
WHERE id = $1 AND user_id = $2;

-- name: GetActiveSession :one
SELECT * FROM sessions
WHERE user_id = $1 AND status = 'active'
ORDER BY started_at DESC
LIMIT 1;

-- name: GetTodayActiveSession :one
SELECT * FROM sessions
WHERE user_id = $1 
  AND status = 'active' 
  AND started_at::date = CURRENT_DATE
ORDER BY started_at DESC
LIMIT 1;

-- name: ListSessionsByUser :many
SELECT * FROM sessions
WHERE user_id = $1
ORDER BY started_at DESC
LIMIT $2 OFFSET $3;

-- name: ListSessionsWithPreview :many
SELECT 
    s.*,
    COALESCE(
        (SELECT LEFT(m.content, 150)
         FROM messages m 
         WHERE m.session_id = s.id AND m.role = 'user' 
         ORDER BY m.created_at ASC 
         LIMIT 1),
        ''
    ) as first_user_message
FROM sessions s
WHERE s.user_id = $1
ORDER BY s.started_at DESC
LIMIT $2 OFFSET $3;

-- name: EndSession :one
UPDATE sessions
SET 
    status = $2,
    ended_at = NOW(),
    updated_at = NOW()
WHERE id = $1 AND user_id = $3
RETURNING *;

-- name: IncrementSessionMessages :one
UPDATE sessions
SET 
    total_messages = total_messages + 1,
    updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: AddSessionGoldenInk :one
UPDATE sessions
SET 
    golden_ink_earned = golden_ink_earned + $2,
    updated_at = NOW()
WHERE id = $1
RETURNING *;

-- ==================== MESSAGES ====================

-- name: CreateMessage :one
INSERT INTO messages (session_id, role, content)
VALUES ($1, $2, $3)
RETURNING *;

-- name: ListMessagesBySession :many
SELECT * FROM messages
WHERE session_id = $1
ORDER BY created_at ASC;

-- name: CountMessagesBySession :one
SELECT COUNT(*) FROM messages
WHERE session_id = $1;

-- name: CountUserMessagesBySession :one
SELECT COUNT(*) FROM messages
WHERE session_id = $1 AND role = 'user';

-- name: GetRecentMessages :many
SELECT * FROM messages
WHERE session_id = $1
ORDER BY created_at DESC
LIMIT $2;

-- ==================== ARTWORKS ====================

-- name: ListArtworks :many
SELECT * FROM artworks
ORDER BY unlock_cost ASC;

-- name: GetArtworkByID :one
SELECT * FROM artworks
WHERE id = $1;

-- name: GetArtworkByName :one
SELECT * FROM artworks
WHERE name = $1;

-- name: CreateArtwork :one
INSERT INTO artworks (name, display_name, description, image_url, unlock_cost, reveal_cost)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING *;

-- ==================== USER ARTWORKS ====================

-- name: GetUserArtwork :one
SELECT * FROM user_artworks
WHERE user_id = $1 AND artwork_id = $2;

-- name: ListUserArtworks :many
SELECT 
    ua.*,
    a.name,
    a.display_name,
    a.description,
    a.image_url,
    a.unlock_cost,
    a.reveal_cost
FROM user_artworks ua
JOIN artworks a ON ua.artwork_id = a.id
WHERE ua.user_id = $1
ORDER BY ua.created_at DESC;

-- name: UnlockArtwork :one
INSERT INTO user_artworks (user_id, artwork_id, status, unlocked_at)
VALUES ($1, $2, 'in_progress', NOW())
RETURNING *;

-- name: UpdateArtworkProgress :one
UPDATE user_artworks
SET 
    progress = $3,
    status = CASE WHEN $3 >= 100 THEN 'completed' ELSE status END,
    completed_at = CASE WHEN $3 >= 100 THEN NOW() ELSE completed_at END,
    updated_at = NOW()
WHERE user_id = $1 AND artwork_id = $2
RETURNING *;

-- name: GetCurrentArtwork :one
SELECT 
    ua.*,
    a.name,
    a.display_name,
    a.description,
    a.image_url,
    a.unlock_cost,
    a.reveal_cost
FROM user_artworks ua
JOIN artworks a ON ua.artwork_id = a.id
WHERE ua.user_id = $1 AND ua.status = 'in_progress'
ORDER BY ua.unlocked_at DESC
LIMIT 1;

-- ==================== WEEKLY SUMMARIES ====================

-- name: CreateWeeklySummary :one
INSERT INTO weekly_summaries (user_id, week_start, week_end, summary, session_count, message_count, emotions)
VALUES ($1, $2, $3, $4, $5, $6, $7)
RETURNING *;

-- name: GetWeeklySummary :one
SELECT * FROM weekly_summaries
WHERE user_id = $1 AND week_start = $2;

-- name: ListWeeklySummaries :many
SELECT * FROM weekly_summaries
WHERE user_id = $1
ORDER BY week_start DESC
LIMIT $2 OFFSET $3;

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
SELECT 
    COUNT(DISTINCT s.id)::integer as session_count, 
    COUNT(m.id)::integer as message_count
FROM sessions s
LEFT JOIN messages m ON m.session_id = s.id AND m.role = 'user'
WHERE s.user_id = $1
  AND s.started_at >= $2
  AND s.started_at <= $3;

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
SELECT COUNT(*)::integer FROM messages m
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
    SELECT 1 FROM user_subscriptions us WHERE us.trakteer_transaction_id = $1
    UNION
    SELECT 1 FROM pending_upgrades pu WHERE pu.trakteer_transaction_id = $1
) as processed;
