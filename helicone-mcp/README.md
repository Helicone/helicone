# Helicone MCP Server

A Model Context Protocol (MCP) server for querying Helicone observability platform data.

## Installation

```json
{
  "mcpServers": {
    "helicone": {
      "command": "npx",
      "args": ["-y", "helicone-mcp@latest"],
      "headers": {
        "Authorization": "your-helicone-api-key"
      }
    }
  }
}
```