# Helicone MCP Server

A Model Context Protocol (MCP) server for querying Helicone request data. This allows AI assistants like Claude to directly query and analyze your Helicone LLM observability data.

## Features

- **Single Tool**: `query_requests` - Query your Helicone requests with filters, pagination, and sorting
- **Type-Safe**: Uses auto-generated types from the Helicone API
- **DRY Principle**: Reuses existing type definitions from the main Helicone codebase

## Prerequisites

- Helicone API Key (get one at [helicone.ai](https://helicone.ai))
- Node.js and yarn installed

## Development

### Running Locally

```bash
cd helicone-mcp
yarn start
```

The server will be available at `http://localhost:8788/sse`

### Building

```bash
yarn build
```

### Deploying to Cloudflare

```bash
yarn deploy
```

## Using the MCP Server

### With Claude Desktop

1. Install the `mcp-remote` proxy:
   ```bash
   npm install -g mcp-remote
   ```

2. Configure Claude Desktop by editing the MCP settings (Settings > Developer > Edit Config):
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
           "HELICONE_API_KEY": "your-api-key-here"
         }
       }
     }
   }
   ```

3. Restart Claude Desktop

### With Cloudflare AI Playground

1. Deploy your MCP server to Cloudflare Workers
2. Go to [playground.ai.cloudflare.com](https://playground.ai.cloudflare.com/)
3. Enter your deployed MCP server URL (e.g., `helicone-mcp.your-account.workers.dev/sse`)
4. Configure the `HELICONE_API_KEY` environment variable

## Tool Reference

### query_requests

Query Helicone requests with flexible filtering and pagination.

**Parameters:**
- `filter` (optional): Filter criteria for requests
- `offset` (optional): Pagination offset
- `limit` (optional): Maximum number of results to return
- `sort` (optional): Sort criteria
- `isCached` (optional): Filter for cached requests
- `includeInputs` (optional): Include request inputs
- `isPartOfExperiment` (optional): Filter for experiment requests
- `isScored` (optional): Filter for scored requests

**Example Usage:**

```
Query my last 10 requests
```

```
Show me all requests with errors from the last 24 hours
```

```
Find requests that cost more than $0.01
```

## Type Generation

The MCP server automatically receives updated types when you run the type generation in the main Helicone repository:

```bash
cd valhalla/jawn
python genTypes.py
```

This copies the latest `public.ts` types to `helicone-mcp/src/types/public.ts`.

## Architecture

- **Framework**: Cloudflare Workers with `agents/mcp` library
- **Types**: Auto-generated from TSOA controllers via `genTypes.py`
- **Endpoint**: Queries `https://api.helicone.ai/v1/request/query-clickhouse`
- **Authentication**: Uses `HELICONE_API_KEY` from environment variables

## Troubleshooting

### API Key Issues

Make sure your `HELICONE_API_KEY` is correctly set in your MCP client configuration. The key should have read permissions for requests.

### Connection Issues

- For local development, ensure the server is running on port 8788
- For production, verify your Cloudflare Workers deployment is active

### Empty Results

Check your API key permissions and verify that you have requests in your Helicone account.
