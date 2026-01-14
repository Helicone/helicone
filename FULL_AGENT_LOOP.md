# Full Agent Loop - Local Development Setup

This document captures the complete setup process for running Helicone locally and testing the full request flow from client to LLM provider and back through the observability pipeline.

## Prerequisites

Before starting, ensure you have:
- Docker installed and running
- Homebrew (macOS)
- NVM (Node Version Manager)

### Node.js Setup

```bash
# Install NVM if not already installed
# https://github.com/nvm-sh/nvm

# Install and use Node 22
nvm install 22
nvm use 22
```

## Infrastructure Setup

### 1. Start Supabase

```bash
# Start Supabase (excluding unnecessary services for local dev)
npx supabase start -x realtime,storage-api,imgproxy,mailpit,edge-runtime,logflare,vector,supavisor
```

### 2. Start Docker Services (MinIO & ClickHouse)

```bash
# Start MinIO (object storage) and ClickHouse (analytics)
docker compose up minio minio-setup clickhouse -d
```

### 3. Run ClickHouse Migrations

```bash
# Set up Python virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
python3 -m pip install tabulate yarl

# Run ClickHouse migrations
python3 clickhouse/ch_hcone.py --upgrade --skip-confirmation --no-password
```

### 4. Seed Data

The seed file at `supabase/seeds/0_seed.sql` creates test users and organizations. This is typically applied automatically when Supabase starts.

### Infrastructure Summary

After these steps, you'll have running:
- **Supabase** (PostgreSQL) - Application data
- **ClickHouse** - Analytics/time-series data
- **MinIO** - Object storage

## Services

### Start All Services

Run each in a separate terminal:

```bash
# Terminal 1 - Jawn (Backend API)
cd valhalla/jawn && yarn dev
# Runs on http://localhost:8585

# Terminal 2 - Web (Frontend)
cd web && yarn dev:local -p 3000
# Runs on http://localhost:3000

# Terminal 3 - Gateway Worker (Proxy)
cd worker && npx wrangler dev --var WORKER_TYPE:GATEWAY_API --port 8789
# Runs on http://localhost:8789
```

### Service Health Checks

```bash
# Jawn health check
curl http://localhost:8585/healthcheck
# Expected: {"status":"healthy :)"}
```

## Test Credentials

From `supabase/seeds/0_seed.sql`:

| User | Email | Helicone API Key | Organization |
|------|-------|------------------|--------------|
| Test | test@helicone.ai | `sk-helicone-aizk36y-5yue2my-qmy5tza-n7x3aqa` | Organization for Test |
| Admin | admin@helicone.ai | `sk-helicone-zk6xu4a-kluegtq-sbljk7q-drnixzi` | Admin |

**Login password**: `password`

## Testing the Full Loop

### Send a Test Request

Use the Gateway Worker (port 8789) with `Helicone-Target-Url` header to proxy requests:

```bash
curl -X POST "http://localhost:8789/v1beta/models/gemini-2.0-flash:generateContent" \
  -H "Content-Type: application/json" \
  -H "Helicone-Auth: Bearer sk-helicone-aizk36y-5yue2my-qmy5tza-n7x3aqa" \
  -H "Helicone-Target-Url: https://generativelanguage.googleapis.com" \
  -H "x-goog-api-key: YOUR_GEMINI_API_KEY" \
  -d '{
    "contents": [{
      "parts": [{"text": "Say hello in exactly 3 words"}]
    }]
  }'
```

### Verify in Dashboard

1. Navigate to http://localhost:3000
2. Sign in with `test@helicone.ai` / `password`
3. **Important**: Switch to "Organization for Test" using the org selector (top-left)
4. Go to Requests page to see logged requests

## Data Flow Architecture

```
┌─────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Client    │────▶│  Gateway Worker │────▶│   LLM Provider  │
│  (curl)     │     │   (port 8789)   │     │ (Gemini, etc.)  │
└─────────────┘     └────────┬────────┘     └─────────────────┘
                             │
                             │ Logs request/response
                             ▼
                    ┌─────────────────┐
                    │      Jawn       │
                    │  (port 8585)    │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
        ┌──────────┐  ┌───────────┐  ┌──────────┐
        │ Postgres │  │ClickHouse │  │  MinIO   │
        │ (Supa)   │  │(Analytics)│  │ (Files)  │
        └──────────┘  └───────────┘  └──────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │    Web (UI)     │
                    │  (port 3000)    │
                    └─────────────────┘
```

## Key Learnings

### 1. Organization Context Matters

Requests are scoped to organizations via the Helicone API key. When viewing the dashboard:
- The default "My Organization" shows demo/preview data
- You must switch to the correct org (e.g., "Organization for Test") to see actual requests

### 2. Worker Types

Different worker types serve different purposes:

| Port | Worker Type | Use Case |
|------|-------------|----------|
| 8787 | `OPENAI_PROXY` | OpenAI-specific proxy |
| 8788 | `HELICONE_API` | Helicone API worker |
| 8789 | `GATEWAY_API` | Generic gateway (any provider) |
| 8790 | `ANTHROPIC_PROXY` | Anthropic-specific proxy |
| 8793 | `AI_GATEWAY_API` | Unified routing with billing |

For testing with arbitrary providers (like Gemini), use `GATEWAY_API` (8789) with the `Helicone-Target-Url` header.

### 3. Authentication Headers

- `Helicone-Auth: Bearer <api-key>` - Authenticates with Helicone
- `Helicone-Target-Url: <provider-base-url>` - Specifies the LLM provider
- Provider-specific auth (e.g., `x-goog-api-key` for Gemini)

### 4. Demo Data vs Real Data

The dashboard shows demo/preview data when:
- No requests have been logged for the organization
- You're viewing the wrong organization

Look for the banner: "This is a preview. Integrate your LLM app with Helicone to see your actual requests."

### 5. Web Dev Command Variants

- `yarn dev:better-auth` - Uses better-auth authentication (may require additional setup)
- `yarn dev:local -p 3000` - Simpler local development mode

## Troubleshooting

### Request Not Appearing in Dashboard

1. Verify you're in the correct organization
2. Check Jawn logs for errors: `tail -f /tmp/claude/.../tasks/<jawn-task-id>.output`
3. Ensure the Helicone API key matches the organization

### Worker Connection Issues

- Ensure Jawn is running before making requests through the worker
- Check that the worker can reach Jawn at localhost:8585

### Database Connection Issues

- Verify Supabase is running: `docker ps | grep supabase`
- Check ClickHouse: `docker ps | grep clickhouse`

## Next Steps

With the full loop working, you can now:
1. Test different LLM providers through the gateway
2. Explore request logging and analytics
3. Build features on top of the observability pipeline
4. Test caching, rate limiting, and other Helicone features
