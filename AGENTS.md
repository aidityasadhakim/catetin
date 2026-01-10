# Catetin - AI Agent Guidelines

## Project Overview

Catetin is a journaling application with:
- Go/Echo backend with PostgreSQL
- React/TanStack frontend with Clerk auth

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

## Adding New Features

1. Add migration in `backend/sql/migrations/`
2. Add queries in `backend/sql/queries/queries.sql`
3. Run `make sqlc` to generate Go code
4. Add handler in `backend/internal/handlers/`
5. Register route in `backend/internal/routes/routes.go`
6. Add frontend hook in `frontend/src/hooks/`
7. Create component/route in `frontend/src/`
