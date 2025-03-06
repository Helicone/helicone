# OpenAI TypeScript SDK Integration

## OpenAI v4+ SDK

```javascript
// Before
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// After
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: "https://oai.helicone.ai/v1",
  defaultHeaders: {
    "Helicone-Auth": `Bearer ${process.env.HELICONE_API_KEY}`,
  },
});

// Example usage
const chatCompletion = await openai.chat.completions.create({
  model: "gpt-4",
  messages: [{ role: "user", content: "Hello world" }],
});
```

## Required Environment Variables

```
HELICONE_API_KEY=your_helicone_api_key
```

## AST Transformation

```json
{
  "file": "path/to/openai-client.ts",
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
        "object_name": "OpenAI"
      },
      "property_name": "baseURL",
      "property_value": "\"https://oai.helicone.ai/v1\""
    },
    {
      "type": "add_object_property",
      "target": {
        "type": "variable_declaration",
        "name": "openai",
        "object_name": "OpenAI"
      },
      "property_name": "defaultHeaders",
      "property_value": "{\n  \"Helicone-Auth\": `Bearer ${process.env.HELICONE_API_KEY}`\n}"
    }
  ]
}
```
