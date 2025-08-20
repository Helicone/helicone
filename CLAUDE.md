# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Helicone is an open-source LLM observability platform that provides monitoring, analytics, and management tools for Large Language Model applications. The project is structured as a monorepo with multiple services.

## Core Architecture

### Services
- **Web (Frontend)**: Next.js dashboard app at `/web`
- **Jawn (Backend)**: Express.js API server at `/valhalla/jawn`
- **Worker (Proxy)**: Cloudflare Workers for LLM request interception at `/worker`
- **AI Gateway**: Rust-based LLM proxy/router at `/aigateway`
- **Bifrost**: Marketing/landing page at `/bifrost`

### Data Flow
1. Client → Helicone Proxy → LLM Provider
2. Proxy sends logs to Upstash queue → Jawn processes → Databases
3. PostgreSQL for app data, ClickHouse for analytics, MinIO for object storage

## Development Commands

### Main Development
```bash
# Start local development (requires Docker)
./helicone-compose.sh helicone up

# Web development
cd web && yarn dev:better-auth          # With better-auth
cd web && yarn dev:local               # Local development

# Backend development
cd valhalla/jawn && yarn dev

# AI Gateway (Rust)
cd aigateway && cargo run

# Worker development (different types)
cd worker && npx wrangler dev --local --var WORKER_TYPE:OPENAI_PROXY --port 8787
```

### Build & Test
```bash
# Web
cd web && yarn build && yarn test && yarn lint

# Backend
cd valhalla/jawn && yarn build && yarn test:jawn

# AI Gateway
cd aigateway && cargo build && cargo test --tests --all-features && cargo clippy
```

## Code Style Guidelines

### Frontend (Web)
- Use TypeScript with strict typing
- Follow design system with semantic components from `/web/components/ui/typography`
- Use Tailwind utility classes for styling with semantic color tokens
- Icons from `lucide-react` with consistent sizing via `size` prop
- Layout with flexbox + gap, avoid margins for spacing

### Component Patterns
```tsx
// Typography components
import { H1, H2, P, Small, Muted } from "@/components/ui/typography"

// Colors - use semantic tokens
className="bg-background text-foreground border-border"

// Layout - use flex + gap
<div className="flex flex-col gap-4">
<div className="flex items-center gap-2">
```

### Backend (Jawn)
- Controllers in `/valhalla/jawn/src/controllers/` use TSOA decorators
- Managers in `/valhalla/jawn/src/managers/` extend `BaseManager`
- Use `JawnAuthenticatedRequest` and return `Result<T, string>`
- Frontend hooks use TanStack Query with `useJawnClient()`

### Database
- PostgreSQL with snake_case naming
- ClickHouse for analytics
- Proper RLS policies for security

## Tech Stack

### Frontend
- Next.js 14 with React 18.3.1
- TypeScript, Tailwind CSS, Radix UI
- Zustand for state management
- TanStack Query for server state

### Backend
- Express.js with TSOA
- Supabase (PostgreSQL) + ClickHouse
- Upstash Redis for queuing
- Better Auth for authentication

### Infrastructure
- Cloudflare Workers for proxying
- Docker for local development
- MinIO for object storage

## Key Directories

```
/web/                   # Next.js frontend
/valhalla/jawn/        # Express.js backend
/worker/               # Cloudflare Workers
/aigateway/            # Rust LLM proxy
/bifrost/              # Marketing site
/packages/             # Shared packages
  ├── cost/            # Cost calculations
  ├── llm-mapper/      # Provider mappings
  └── prompts/         # Prompt management
/supabase/             # Database migrations
/clickhouse/           # Analytics DB setup
```

## Development Workflow

1. Start infrastructure with Docker: `./helicone-compose.sh helicone up`
2. Start web: `cd web && yarn dev:better-auth`
3. Start backend: `cd valhalla/jawn && yarn dev`
4. Access at `http://localhost:3000`

## Testing

- Web: `yarn test` (Jest)
- Backend: `yarn test:jawn`
- AI Gateway: `cargo test --tests --all-features`
- E2E tests available in Python

## Common Tasks

### Adding New Features
1. Design API in Jawn controller with TSOA
2. Implement manager with database operations
3. Create frontend hooks with TanStack Query
4. Follow design system for UI components

### Database Changes
1. Add migrations in `/supabase/migrations/`
2. Update types and managers accordingly
3. Test with proper RLS policies

### Style Changes
- Use semantic color tokens, never raw colors
- Follow typography component system
- Use flexbox + gap for layouts
- Test in both light and dark modes
- when making changes to /packages run the tests npx jest __tests__/ in /packages to make sure nothing else is broken