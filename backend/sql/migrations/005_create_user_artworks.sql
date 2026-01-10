-- +goose Up
-- +goose StatementBegin
CREATE TABLE IF NOT EXISTS user_artworks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    artwork_id UUID NOT NULL REFERENCES artworks(id) ON DELETE CASCADE,
    progress INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'locked',
    unlocked_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT user_artworks_user_artwork_unique UNIQUE (user_id, artwork_id),
    CONSTRAINT user_artworks_progress_check CHECK (progress >= 0 AND progress <= 100),
    CONSTRAINT user_artworks_status_check CHECK (status IN ('locked', 'in_progress', 'completed'))
);

CREATE INDEX idx_user_artworks_user_id ON user_artworks(user_id);
CREATE INDEX idx_user_artworks_user_id_status ON user_artworks(user_id, status);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE IF EXISTS user_artworks;
-- +goose StatementEnd
