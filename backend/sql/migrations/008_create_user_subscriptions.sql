-- +goose Up
-- +goose StatementBegin

-- User subscription status (free or paid)
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

-- Pending upgrades for failed email lookups from Trakteer webhook
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
