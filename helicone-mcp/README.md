# Helicone MCP Server

A Model Context Protocol (MCP) server for querying Helicone observability platform data and making LLM requests through the Helicone AI Gateway.

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

### `use_ai_gateway`

Make LLM requests through Helicone AI Gateway with automatic observability. Supports 100+ models from OpenAI, Anthropic, Google, and more using OpenAI SDK format.

**Parameters:**
- `model` (required): Model name (e.g., 'gpt-4o', 'claude-sonnet-4', 'gemini-2.0-flash')
- `messages` (required): Array of messages with `role` ("system", "user", "assistant") and `content`
- `max_tokens` (optional): Maximum tokens to generate
- `temperature` (optional): Response randomness (0-2, default 1)
- `stream` (optional): Enable streaming response (default false)
- `sessionId` (optional): Session ID for tracking related requests
- `sessionName` (optional): Human-readable session name
- `userId` (optional): User ID for tracking requests by user
- `customProperties` (optional): Custom properties for request metadata

**Use cases:** Making LLM requests with automatic observability, accessing multiple model providers through one interface, tracking conversations and users.

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
