# Vercel AI SDK TypeScript Integration (OpenAI)

## Vercel AI SDK with OpenAI

```javascript
// Before
import { createOpenAI } from "@ai-sdk/openai";

const openai = createOpenAI({
  // Default configuration
});

// After
import { createOpenAI } from "@ai-sdk/openai";

const openai = createOpenAI({
  baseURL: "https://oai.helicone.ai/v1",
  headers: {
    "Helicone-Auth": `Bearer ${process.env.HELICONE_API_KEY}`,
  },
});

// Use openai to make API calls
const response = streamText({
  model: openai("gpt-4o"),
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
  "file": "path/to/vercel-ai-client.ts",
  "transformations": [
    {
      "type": "add_code_after_imports",
      "code": "// Helicone API key validation\nif (!process.env.HELICONE_API_KEY) {\n  throw new Error(\"HELICONE_API_KEY is required for API monitoring\");\n}"
    },
    {
      "type": "add_object_property",
      "target": {
        "type": "variable_declaration",
        "name": "openai",
        "object_name": "createOpenAI"
      },
      "property_name": "baseURL",
      "property_value": "\"https://oai.helicone.ai/v1\""
    },
    {
      "type": "add_object_property",
      "target": {
        "type": "variable_declaration",
        "name": "openai",
        "object_name": "createOpenAI"
      },
      "property_name": "headers",
      "property_value": "{\n  \"Helicone-Auth\": `Bearer ${process.env.HELICONE_API_KEY}`\n}"
    }
  ]
}
```
