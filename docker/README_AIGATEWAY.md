# AI Gateway Docker Setup Guide

## Common Issue: "docker compose build aigateway" fails

**Error Message:**
```
unable to prepare context: path "/root/git/helicone/helicone/aigateway" not found
```

### Why This Happens

The AI Gateway is a **separate open-source Rust project** hosted at [github.com/helicone/ai-gateway](https://github.com/helicone/ai-gateway), not part of this main Helicone repository. The `aigateway` directory in this repo only contains configuration files (`.env`), not the source code.

### Solution 1: Use Pre-built Image (Recommended)

The `docker-compose.yml` is now configured to use the pre-built image by default. Simply run:

```bash
# Start all Helicone services including AI Gateway
docker compose --profile include-helicone up

# Or start just the AI Gateway
docker compose --profile include-helicone up aigateway
```

**For Apple Silicon (ARM64) users:** The configuration includes `platform: linux/amd64` for compatibility.

### Solution 2: Build from Source (Development)

If you want to build the AI Gateway from source:

1. **Clone the AI Gateway repository:**
   ```bash
   git clone https://github.com/Helicone/ai-gateway.git ../ai-gateway
   ```

2. **Edit `docker-compose.yml`:**
   - Comment out the `image` and `platform` lines in the `aigateway` service
   - Uncomment the `build` section and update the context to `../ai-gateway`

3. **Build and run:**
   ```bash
   docker compose --profile include-helicone build aigateway
   docker compose --profile include-helicone up aigateway
   ```

### Solution 3: Skip AI Gateway

If you don't need the AI Gateway, simply omit the `include-helicone` profile:

```bash
# Run Helicone without AI Gateway
docker compose up
```

## Configuration

### Environment Variables

Create/edit `aigateway/.env` with your API keys:

```bash
# Required for AI Gateway functionality
export OPENAI_API_KEY="sk-proj-your-key-here"
export ANTHROPIC_API_KEY="sk-ant-your-key-here"
export GEMINI_API_KEY="your-gemini-key"

# Optional: Helicone integration
export PROXY__HELICONE__API_KEY="sk-helicone-your-key"

# Optional: OpenTelemetry
export OTEL_METRIC_EXPORT_INTERVAL=5000
```

### Port Configuration

- **External Port:** 5678 (accessible via `http://localhost:5678`)
- **Port Mapping:** 5678:8080 (external:internal - AI Gateway runs on port 8080 internally)

### Testing the Setup

Test that AI Gateway is working:

```bash
# Health check (if available)
curl http://localhost:5678/health

# Test chat completions endpoint
curl --request POST \
  --url http://localhost:5678/ai/chat/completions \
  --header 'Content-Type: application/json' \
  --data '{
    "model": "openai/gpt-4o-mini",
    "messages": [
      {
        "role": "user",
        "content": "hello world"
      }
    ]
  }'
```

## Troubleshooting

### "no matching manifest for linux/arm64/v8"

This error occurs on Apple Silicon Macs. The solution is already included in the default configuration with `platform: linux/amd64`.

### "Connection refused" or "Connection reset by peer"

1. Check that the service is running: `docker compose ps aigateway`
2. Check logs: `docker compose logs aigateway`
3. Verify port mapping is correct (5678:8080)

### "Invalid API key" errors

This is expected if you haven't configured valid API keys in `aigateway/.env`. The AI Gateway is working correctly if you see API key validation errors from the provider (OpenAI, Anthropic, etc.).

## Profiles

The docker-compose.yml uses profiles to organize services:

- **Default:** Core infrastructure only (PostgreSQL, ClickHouse, MinIO, Redis)
- **`include-helicone`:** Adds Helicone services (Web, Jawn, AI Gateway)
- **`build-from-source`:** Alternative AI Gateway built from source
- **`dev`:** Development versions with hot reload
- **`workers`:** Cloudflare Workers for proxy functionality

Example usage:
```bash
# Infrastructure + Helicone services
docker compose --profile include-helicone up

# Everything for development
docker compose --profile include-helicone --profile dev up
```

## Additional Resources

- [AI Gateway Documentation](https://docs.helicone.ai/ai-gateway/introduction)
- [AI Gateway GitHub Repository](https://github.com/helicone/ai-gateway)
- [AI Gateway Quickstart](https://docs.helicone.ai/ai-gateway/quickstart) 