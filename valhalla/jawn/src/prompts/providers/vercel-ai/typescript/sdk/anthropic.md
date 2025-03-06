# Vercel AI SDK TypeScript Integration (Anthropic)

## Vercel AI SDK with Anthropic

```javascript
// Before
import { createAnthropic } from "@ai-sdk/anthropic";

const anthropic = createAnthropic({
  // Default configuration
});

// After
import { createAnthropic } from "@ai-sdk/anthropic";

const anthropic = createAnthropic({
  baseURL: "https://anthropic.helicone.ai/v1",
  headers: {
    "Helicone-Auth": `Bearer ${process.env.HELICONE_API_KEY}`,
  },
});

// Use anthropic to make API calls
const response = streamText({
  model: anthropic("claude-3-5-sonnet-20241022"),
  prompt: "Hello world",
});
```

## Required Environment Variables

```
HELICONE_API_KEY=your_helicone_api_key
```

## AST Transformation

```json
{
  "file": "path/to/vercel-ai-anthropic-client.ts",
  "transformations": [
    {
      "type": "add_code_after_imports",
      "code": "// Helicone API key validation\nif (!process.env.HELICONE_API_KEY) {\n  throw new Error(\"HELICONE_API_KEY is required for API monitoring\");\n}"
    },
    {
      "type": "add_object_property",
      "target": {
        "type": "variable_declaration",
        "name": "anthropic",
        "object_name": "createAnthropic"
      },
      "property_name": "baseURL",
      "property_value": "\"https://anthropic.helicone.ai/v1\""
    },
    {
      "type": "add_object_property",
      "target": {
        "type": "variable_declaration",
        "name": "anthropic",
        "object_name": "createAnthropic"
      },
      "property_name": "headers",
      "property_value": "{\n  \"Helicone-Auth\": `Bearer ${process.env.HELICONE_API_KEY}`\n}"
    }
  ]
}
```
