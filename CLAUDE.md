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

## Deprecated Components

### Jawn Gateway (DEPRECATED)

The proxy gateway at `/valhalla/jawn/src/controllers/public/proxyController.ts` (`/v1/gateway/:provider/*`) is **deprecated**. Do NOT add new features, tests, or improvements to this gateway.

**Use the Cloudflare Worker gateway instead:**
- Production gateway code: `/worker/src/routers/`
- User endpoints: `oai.helicone.ai`, `anthropic.helicone.ai`, `gateway.helicone.ai`

The Jawn gateway exists only for backwards compatibility and local development fallback. All rate limiting, caching, and proxy features should be implemented in the Worker, not Jawn.

**Related deprecated files (do not modify):**
- `/valhalla/jawn/src/lib/proxy/` - Proxy utilities
- `/valhalla/jawn/src/lib/proxy/RateLimiter.ts` - Legacy rate limiter

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
- when making changes to /packages run the tests npx jest **tests**/ in /packages to make sure nothing else is broken

# Helicone Design System Guidelines

## Core Principles

1. Use semantic HTML elements
2. Use Tailwind utility classes for colors
3. Use typography components for consistent text styling
4. Use Tailwind's spacing scale
5. Use lucide-react for icons

## Typography System

### Usage Patterns

```tsx
// ✅ Do this
import { H1, P, Small, Muted } from "@/components/ui/typography"

<H1>Page Title</H1>
<P>Regular paragraph</P>
<Small>Helper text</Small>
<Muted>Secondary text</Muted>

// ❌ Don't do this
<h1 className="text-4xl font-bold">Raw Styles</h1>
<H1 className="text-3xl">Overriding Typography</H1>
<P className="text-sm">Wrong Size</P>
```

### Available Components

```tsx
// Headings
<H1>              // Main page titles
<H1Large>         // Hero sections
<H2>              // Section headers
<H3>              // Subsection headers
<H4>              // Card titles

// Body Text
<P>               // Regular paragraphs
<Lead>            // Introduction text
<Large>           // Emphasized body text
<Small>           // Helper text
<Muted>           // Secondary text

// Special Elements
<Blockquote>      // Quotations
<Code>            // Inline code
<List>            // Unordered lists

// Table Elements
<TableHead>       // Table headers
<TableCell>       // Table cells
```

### Typography Scale

| Component | Size                                 | Line Height       | Weight    | Usage              |
| --------- | ------------------------------------ | ----------------- | --------- | ------------------ |
| H1        | text-3xl (30px) / lg:text-4xl (36px) | leading-10 (40px) | semibold  | Main page titles   |
| H1Large   | text-5xl (48px)                      | leading-10 (40px) | extrabold | Hero sections      |
| H2        | text-3xl (30px)                      | leading-9 (36px)  | semibold  | Section headers    |
| H3        | text-2xl (24px)                      | leading-8 (32px)  | semibold  | Subsection headers |
| H4        | text-xl (20px)                       | leading-7 (28px)  | semibold  | Card titles        |
| Lead      | text-xl (20px)                       | leading-7 (28px)  | normal    | Introduction text  |
| P         | text-base (16px)                     | leading-7 (28px)  | normal    | Body text          |
| Small     | text-sm (14px)                       | leading-4 (16px)  | medium    | Helper text        |
| Muted     | text-sm (14px)                       | leading-none      | normal    | Secondary text     |

## Color System

### Usage Patterns

```tsx
// 1. Use Tailwind utility classes for colors
✅ text-foreground
✅ bg-background
✅ border-border

// 2. Use foreground variants for text on colored backgrounds
✅ bg-primary text-primary-foreground
✅ bg-destructive text-destructive-foreground

// ❌ Don't use CSS variables directly
❌ text-[hsl(var(--foreground))]
❌ bg-[hsl(var(--background))]

// ❌ Don't use raw colors
❌ text-slate-900
❌ bg-white
```

### Color Utility Classes

```tsx
/* Text Colors */
text - foreground; // Primary text
text - muted - foreground; // Secondary text
text - accent - foreground; // Accent text

/* Background Colors */
bg - background; // Page background
bg - card; // Card background
bg - muted; // Muted background

/* Border Colors */
border - border; // Default borders
border - input; // Form inputs
ring - ring; // Focus rings
```

## Color Reference Values

### Primary Colors

```tsx
/* Light Mode */
bg - primary; // #0EA5E9 (sky-500)
text - primary - foreground; // #F0F9FF (sky-50)

/* Dark Mode */
bg - primary; // #0284C7 (sky-600)
text - primary - foreground; // #083344 (sky-950)
```

### Background Colors

```tsx
/* Light Mode */
bg - background; // #FFFFFF (white)
text - foreground; // #0F172A (slate-900)

/* Dark Mode */
bg - background; // #020617 (slate-950)
text - foreground; // #F8FAFC (slate-50)
```

### Accent Colors

```tsx
/* Light Mode */
bg - accent; // #F1F5F9 (slate-100)
text - accent - foreground; // #0F172A (slate-900)

/* Dark Mode */
bg - accent; // #1E293B (slate-800)
text - accent - foreground; // #F8FAFC (slate-50)
```

### UI Component Colors

```tsx
/* Light Mode */
bg - card; // #FFFFFF (white)
text - card - foreground; // #020617 (slate-950)
bg - popover; // #FFFFFF (white)
text - popover - foreground; // #020617 (slate-950)
border - border; // #E2E8F0 (slate-200)
border - input; // #E2E8F0 (slate-200)
ring - ring; // #0F172A (slate-900)

/* Dark Mode */
bg - card; // #020617 (slate-950)
text - card - foreground; // #F8FAFC (slate-50)
bg - popover; // #020617 (slate-950)
text - popover - foreground; // #F8FAFC (slate-50)
border - border; // #1E293B (slate-800)
border - input; // #1E293B (slate-800)
ring - ring; // #CBD5E1 (slate-300)
```

### Semantic Colors

```tsx
/* Light Mode */
bg - muted; // #F1F5F9 (slate-100)
text - muted - foreground; // #64748B (slate-500)
bg - secondary; // #F1F5F9 (slate-100)
text - secondary - foreground; // #0F172A (slate-900)
bg - destructive; // #DC2626 (red-600)
text - destructive - foreground; // #450A0A (red-950)
bg - confirmative; // #16A34A (green-600)
text - confirmative - foreground; // #052E16 (green-950)

/* Dark Mode */
bg - muted; // #1E293B (slate-800)
text - muted - foreground; // #94A3B8 (slate-400)
bg - secondary; // #1E293B (slate-800)
text - secondary - foreground; // #F8FAFC (slate-50)
bg - destructive; // #7F1D1D (red-900)
text - destructive - foreground; // #FEF2F2 (red-50)
bg - confirmative; // #14532D (green-900)
text - confirmative - foreground; // #F0FDF4 (green-50)
```

### Sidebar Colors

```tsx
/* Light Mode */
bg - sidebar - background; // #F8FAFC (slate-50)
text - sidebar - foreground; // #334155 (slate-700)
border - sidebar - border; // #E2E8F0 (slate-200)
bg - sidebar - primary; // #0C4A6E (sky-900)
text - sidebar - primary - foreground; // #F0F9FF (sky-50)
bg - sidebar - accent; // #F1F5F9 (slate-100)
text - sidebar - accent - foreground; // #0F172A (slate-900)
ring - sidebar - ring; // #94A3B8 (slate-400)

/* Dark Mode */
bg - sidebar - background; // #0F172A (slate-900)
text - sidebar - foreground; // #F1F5F9 (slate-100)
border - sidebar - border; // #1E293B (slate-800)
bg - sidebar - primary; // #0369A1 (sky-700)
text - sidebar - primary - foreground; // #FFFFFF (white)
bg - sidebar - accent; // #1E293B (slate-800)
text - sidebar - accent - foreground; // #F1F5F9 (slate-100)
ring - sidebar - ring; // #CBD5E1 (slate-300)
```

### Chart Colors

```tsx
/* Light Mode */
bg - chart - 1; // #2A9D90
bg - chart - 2; // #E76E50
bg - chart - 3; // #274754
bg - chart - 4; // #E8C468
bg - chart - 5; // #F4A462

/* Dark Mode */
bg - chart - 1; // #2662D9
bg - chart - 2; // #E23670
bg - chart - 3; // #E88C30
bg - chart - 4; // #AF57DB
bg - chart - 5; // #2EB88A
```

## Layout Best Practices

### Spacing

```tsx
// 1. Use Tailwind's spacing scale with flex + gap
✅ <div className="flex flex-col gap-2">  // Related items (0.5rem)
✅ <div className="flex flex-col gap-4">  // Content blocks (1rem)
✅ <div className="flex flex-col gap-6">  // Sections (1.5rem)

// 2. Use flex + gap for horizontal layouts
✅ <div className="flex gap-4">
✅ <div className="flex items-center gap-2">

// ❌ Don't use space-y or margins for spacing
❌ <div className="space-y-4">
❌ <div className="flex [&>*+*]:ml-4">
❌ <div className="p-[5px]">
```

### Flexbox & Grid

```tsx
// 1. Use flex + gap
✅ <div className="flex gap-4">
✅ <div className="flex flex-col gap-6">

// 2. Use grid + gap
✅ <div className="grid grid-cols-3 gap-4">

// ❌ Don't use margins for spacing
❌ <div className="flex [&>*+*]:ml-4">
❌ <div className="space-y-4">
```

### Container Patterns

```tsx
// Page Container
✅ <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

// Card Container
✅ <div className="rounded-lg border border-border bg-card text-card-foreground">

// Form Groups
✅ <div className="flex flex-col gap-4">
```

### Icons

```tsx
// 1. Import from lucide-react
import { ChevronRight, Settings, Info } from "lucide-react"

// 2. Standard Icon Sizes
// xs: 12px - For very small icons in dense UI
// sm: 14px - For small icons in buttons and forms
// default: 16px - Default size for most icons
// lg: 20px - For larger icons in headers or cards
// xl: 24px - For hero sections or large UI elements

// 3. Use Lucide size prop consistently
✅ <Info size={16} />  // Default size
✅ <Settings size={20} />  // Large size
✅ <ChevronRight size={14} />  // Small size

// ❌ Don't use className for sizing
❌ <Info className="h-4 w-4" />  // Use size prop instead
❌ <Settings className="w-[18px] h-[18px]" />  // Use size prop instead

```

### Component Variants

```tsx
// 1. Use built-in variants instead of custom wrappers
✅ <Button variant="action">Create Organization</Button>
✅ <Button variant="outline" size="sm">Cancel</Button>

// ❌ Don't wrap components unnecessarily
❌ <div className="w-full">
    <Button>Create Organization</Button>
  </div>
❌ <div className="text-white">
    <Button>Create Organization</Button>
  </div>

// 2. Use size variants for consistent sizing
✅ <Button size="sm">Small Button</Button>
✅ <Button size="default">Default Button</Button>
✅ <Button size="lg">Large Button</Button>

// 3. Use asPill for rounded buttons
✅ <Button asPill>Rounded Button</Button>

// 4. Combine variants appropriately
✅ <Button variant="action" size="lg" asPill>Create Account</Button>
```

### Page Layout

```tsx
<article className="flex flex-col gap-6">
  <H1>Welcome to Helicone</H1>
  <Lead>Monitor and analyze your LLM usage</Lead>

  <section className="flex flex-col gap-4">
    <H2>Features</H2>
    <P>Detailed explanation of features...</P>

    <div className="grid grid-cols-3 gap-6">
      {features.map((feature) => (
        <div key={feature.id} className="flex flex-col gap-2">
          <H3>{feature.title}</H3>
          <Muted>{feature.description}</Muted>
        </div>
      ))}
    </div>
  </section>
</article>
```

### Card Pattern

```tsx
<Card>
  <CardHeader>
    <H4>Usage Statistics</H4>
    <Small className="text-muted-foreground">Last 30 days</Small>
  </CardHeader>
  <CardContent>
    <P>Card content...</P>
  </CardContent>
</Card>
```
