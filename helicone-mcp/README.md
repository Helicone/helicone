# Helicone MCP Server

A Model Context Protocol (MCP) server for querying Helicone observability platform data.

## Installation

```json
{
  "mcpServers": {
    "helicone": {
      "type": "stdio",
      "command": "npx",
      "args": ["@helicone/mcp@latest"],
      "env": {
        "HELICONE_API_KEY": "sk-helicone-xxxxxxx-xxxxxxx-xxxxxxx-xxxxxxx"
      }
    }
  }
}
```

## Tools

### `query_requests`

Query requests with filters, pagination, sorting, and optional body content.

**Parameters:**
- `filter` (optional): Filter criteria (model, provider, status, latency, cost, properties, time, user, etc.)
- `offset`, `limit` (optional): Pagination (default: 0, 100)
- `sort` (optional): Sort criteria
- `includeBodies` (optional): Include request/response bodies (default: false)

**Use cases:** Debugging errors, searching logs, analyzing performance, examining request/response bodies.

### `query_sessions`

Query sessions with search, time range filtering, and advanced filters.

**Parameters:**
- `startTimeUnixMs`, `endTimeUnixMs` (required): Time range (Unix timestamp in milliseconds)
- `timezoneDifference` (required): Timezone offset in hours (e.g., -5 for EST)
- `search` (optional): Search by name or metadata
- `nameEquals` (optional): Exact name match
- `filter` (optional): Advanced filter criteria
- `offset`, `limit` (optional): Pagination (default: 0, 100)

**Use cases:** Search sessions, debug conversations, analyze session flows, filter requests by session.

Both tools support full filter capabilities including model/provider, status/error, time, cost/latency, custom properties, and complex AND/OR combinations.

## API Key

Get your API key from [Settings → API Keys](https://us.helicone.ai/settings/api-keys) (or for [EU](https://eu.helicone.ai/settings/api-keys)) and set it as `HELICONE_API_KEY` in your MCP configuration.