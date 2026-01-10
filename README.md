# Catetin

A journaling application built with Go backend and React frontend.

## Tech Stack

### Backend
- **Go** with Echo framework
- **PostgreSQL** database
- **SQLC** for type-safe database queries
- **Clerk** for authentication

### Frontend
- **React 19** with TypeScript
- **TanStack Router** for file-based routing
- **TanStack Query** for server state management
- **Tailwind CSS** for styling
- **Clerk** for authentication

## Quick Start

### Prerequisites
- Docker and Docker Compose
- (Optional) Go 1.24+ for local development
- (Optional) Bun for frontend development

### Development with Docker

1. Copy the environment file:
   ```bash
   cp .env.example .env
   ```

2. Update the Clerk keys in `.env`:
   ```
   CLERK_SECRET_KEY=sk_test_xxx
   VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxx
   ```

3. Start all services:
   ```bash
   make dev
   ```

4. Open your browser:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8080

### Database Migrations

Run migrations after starting services:
```bash
make db-migrate
```

Generate SQLC code after modifying queries:
```bash
make sqlc
```

## Project Structure

```
catetin/
├── backend/
│   ├── cmd/server/        # Application entrypoint
│   ├── internal/
│   │   ├── config/        # Environment configuration
│   │   ├── db/            # Database layer (SQLC)
│   │   ├── handlers/      # HTTP handlers
│   │   ├── middleware/    # Auth middleware
│   │   └── routes/        # Route registration
│   └── sql/
│       ├── migrations/    # Goose migrations
│       ├── queries/       # SQLC queries
│       └── schema/        # Schema reference
├── frontend/
│   └── src/
│       ├── components/    # React components
│       ├── hooks/         # Custom hooks
│       ├── integrations/  # Third-party integrations
│       ├── lib/           # Utilities and API client
│       └── routes/        # TanStack Router pages
├── docker-compose.yml     # Development compose
├── Makefile               # Development commands
└── .env.example           # Environment template
```

## Available Commands

Run `make help` to see all available commands.
