# Anthropic TypeScript SDK Integration

## Anthropic SDK

```javascript
// Before
import Anthropic from "@anthropic-ai/sdk";
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// After
import Anthropic from "@anthropic-ai/sdk";
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  baseURL: "https://anthropic.helicone.ai",
  defaultHeaders: {
    "Helicone-Auth": `Bearer ${process.env.HELICONE_API_KEY}`,
  },
});

// Example usage
const message = await anthropic.messages.create({
  model: "claude-3-opus-20240229",
  max_tokens: 1024,
  messages: [{ role: "user", content: "Hello, world" }],
});
```

## Required Environment Variables

```
HELICONE_API_KEY=your_helicone_api_key
```

## AST Transformation

```json
{
  "file": "path/to/anthropic-client.ts",
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
        "object_name": "Anthropic"
      },
      "property_name": "baseURL",
      "property_value": "\"https://anthropic.helicone.ai\""
    },
    {
      "type": "add_object_property",
      "target": {
        "type": "variable_declaration",
        "name": "anthropic",
        "object_name": "Anthropic"
      },
      "property_name": "defaultHeaders",
      "property_value": "{\n  \"Helicone-Auth\": `Bearer ${process.env.HELICONE_API_KEY}`\n}"
    }
  ]
}
```
