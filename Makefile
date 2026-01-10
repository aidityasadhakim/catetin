.PHONY: help dev dev-detach down logs logs-service restart status \
	db-migrate db-rollback db-status db-reset db-shell \
	sqlc clean clean-volumes shell-frontend frontend-install

.DEFAULT_GOAL := help

# ================================
# Local Development (Root Compose)
# ================================

## Start development with hot-reload
dev:
	docker compose up --build

## Start development in background
dev-detach:
	docker compose up --build -d

## Stop all services
down:
	docker compose down

## View all logs
logs:
	docker compose logs -f

## View specific service logs (usage: make logs-service SERVICE=backend)
logs-service:
	docker compose logs -f $(SERVICE)

## Restart service (usage: make restart SERVICE=backend)
restart:
	docker compose restart $(SERVICE)

## Check service status
status:
	docker compose ps

# ================================
# Database (Local Development)
# ================================

## Install goose locally
goose-install:
	go install github.com/pressly/goose/v3/cmd/goose@latest

## Run database migrations
db-migrate:
	goose -dir backend/sql/migrations postgres "$(DATABASE_URL)" up

## Rollback last migration
db-rollback:
	goose -dir backend/sql/migrations postgres "$(DATABASE_URL)" down

## Check migration status
db-status:
	goose -dir backend/sql/migrations postgres "$(DATABASE_URL)" status

## Reset database (drop all tables and re-run migrations)
db-reset:
	goose -dir backend/sql/migrations postgres "$(DATABASE_URL)" reset
	goose -dir backend/sql/migrations postgres "$(DATABASE_URL)" up

## Connect to database via psql
db-shell:
	docker compose exec db psql -U catetin -d catetin_db

# ================================
# Code Generation
# ================================

## Generate SQLC code
sqlc:
	docker compose exec backend sqlc generate

# ================================
# Cleanup
# ================================

## Remove all containers, volumes, and images
clean:
	docker compose down -v --rmi local --remove-orphans

## Remove only volumes (keeps images)
clean-volumes:
	docker compose down -v

## Install frontend dependencies
frontend-install:
	docker compose exec frontend bun install

# ================================
# Frontend Build
# ================================

## Build frontend static files (for Caddy)
frontend-build:
	@echo "Building frontend..."
	cd frontend && bun install && bun run build
	@echo "Frontend built successfully!"
	@echo "Files are in frontend/dist/"

# ================================
# Help
# ================================

help:
	@echo "Catetin - Available Commands"
	@echo ""
	@echo "Usage: make [target]"
	@echo ""
	@awk '/^## / {desc=$$0; sub(/^## /,"",desc)} /^[a-zA-Z_-]+:/ && desc {printf "  \033[36m%-20s\033[0m %s\n", substr($$1,1,length($$1)-1), desc; desc=""}' $(MAKEFILE_LIST)
	@echo ""
	@echo "Quick Start:"
	@echo "  make dev              # Local development (root compose)"
	@echo "  make frontend-build   # Build frontend static files"
