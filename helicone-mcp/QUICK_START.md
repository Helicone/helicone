# Helicone MCP Server - Quick Start Guide

## Installation & Setup

### 1. Install Dependencies
```bash
cd helicone-mcp
yarn install
```

### 2. Start the Server Locally
```bash
yarn start
```

The server will be available at: `http://localhost:8788/sse`

### 3. Configure Claude Desktop

Edit your Claude Desktop MCP configuration:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

Add this configuration:

```json
{
  "mcpServers": {
    "helicone": {
      "command": "npx",
      "args": [
        "mcp-remote",
        "http://localhost:8788/sse"
      ],
      "env": {
        "HELICONE_API_KEY": "sk-your-api-key-here"
      }
    }
  }
}
```

### 4. Restart Claude Desktop

After restarting, you should see the `query_requests` tool available.

## Using the Tool

### Example Queries

**Get last 10 requests:**
```
Show me my last 10 Helicone requests
```

**Filter by date:**
```
Query my Helicone requests from the last 24 hours
```

**With specific filters:**
```
Find all Helicone requests where the model was gpt-4
```

**Custom query:**
```
Use the query_requests tool with these parameters:
- limit: 5
- sort: { created_at: "desc" }
- includeInputs: true
```

## Tool Parameters

```typescript
{
  filter?: any                  // Filter criteria for requests
  offset?: number              // Pagination offset (default: 0)
  limit?: number               // Max results to return (default: 10)
  sort?: any                   // Sort criteria
  isCached?: boolean           // Filter for cached requests
  includeInputs?: boolean      // Include request inputs
  isPartOfExperiment?: boolean // Filter for experiment requests
  isScored?: boolean           // Filter for scored requests
}
```

## Troubleshooting

### Server won't start
- Check if port 8788 is already in use: `lsof -i :8788`
- Kill the process: `kill -9 <PID>`

### API Key Issues
- Make sure your `HELICONE_API_KEY` starts with `sk-`
- Verify the key has read permissions in Helicone dashboard

### Connection Errors
- Ensure the server is running: `yarn start`
- Check server logs for errors
- Verify the URL in Claude config matches `http://localhost:8788/sse`

## Development

### Run Type Check
```bash
yarn type-check
```

### Format Code
```bash
yarn format
```

### Lint Code
```bash
yarn lint:fix
```

## Deployment

### Deploy to Cloudflare Workers
```bash
yarn deploy
```

After deployment, update your Claude config to use:
```
https://helicone-mcp.<your-account>.workers.dev/sse
```

## Files to Know

- `src/index.ts` - Main MCP server implementation
- `src/types/public.ts` - Auto-generated API types
- `package.json` - Dependencies and scripts
- `wrangler.jsonc` - Cloudflare Workers configuration

## Getting Help

- Check the main README: `HELICONE_MCP_README.md`
- Review the full summary: `HELICONE_MCP_SUMMARY.md`
- Helicone docs: https://docs.helicone.ai
- MCP docs: https://modelcontextprotocol.io
