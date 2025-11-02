# Helicone MCP Server

A Model Context Protocol (MCP) server for querying Helicone observability platform data.

## Installation

```json
{
  "mcpServers": {
    "helicone": {
      "type": "stdio",
      "command": "npx",
      "args": [
        "@helicone/mcp@latest"
      ],
      "env": {
        "HELICONE_API_KEY": "sk-helicone-xxxxxxx-xxxxxxx-xxxxxxx-xxxxxxx"
      }
    }
  }
}
```