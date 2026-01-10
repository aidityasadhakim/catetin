-- +goose Up
-- +goose StatementBegin
ALTER TABLE user_stats
ADD COLUMN level INTEGER NOT NULL DEFAULT 1,
ADD COLUMN current_xp INTEGER NOT NULL DEFAULT 0,
ADD COLUMN total_xp INTEGER NOT NULL DEFAULT 0;
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
ALTER TABLE user_stats
DROP COLUMN level,
DROP COLUMN current_xp,
DROP COLUMN total_xp;
-- +goose StatementEnd
