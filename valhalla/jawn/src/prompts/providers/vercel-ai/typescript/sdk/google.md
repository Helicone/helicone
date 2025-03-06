# Vercel AI SDK TypeScript Integration (Google Gemini)

## Vercel AI SDK with Google Gemini

```javascript
// Before
import { createGoogleGenerativeAI } from "@ai-sdk/google";

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_API_KEY,
  // Default configuration
});

// After
import { createGoogleGenerativeAI } from "@ai-sdk/google";

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_API_KEY,
  baseURL: "https://gateway.helicone.ai/v1beta",
  headers: {
    "Helicone-Auth": `Bearer ${process.env.HELICONE_API_KEY}`,
    "Helicone-Target-URL": "https://generativelanguage.googleapis.com",
  },
});

// Use Google AI to make API calls
const response = streamText({
  model: google("gemini-1.5-pro-latest"),
  prompt: "Hello world",
});
```

## Required Environment Variables

```
HELICONE_API_KEY=your_helicone_api_key
GOOGLE_API_KEY=your_google_api_key
```

## AST Transformation

```json
{
  "file": "path/to/vercel-ai-google-client.ts",
  "transformations": [
    {
      "type": "add_code_after_imports",
      "code": "// Helicone API key validation\nif (!process.env.HELICONE_API_KEY) {\n  throw new Error(\"HELICONE_API_KEY is required for API monitoring\");\n}"
    },
    {
      "type": "add_object_property",
      "target": {
        "type": "variable_declaration",
        "name": "google",
        "object_name": "createGoogleGenerativeAI"
      },
      "property_name": "baseURL",
      "property_value": "\"https://gateway.helicone.ai/v1beta\""
    },
    {
      "type": "add_object_property",
      "target": {
        "type": "variable_declaration",
        "name": "google",
        "object_name": "createGoogleGenerativeAI"
      },
      "property_name": "headers",
      "property_value": "{\n  \"Helicone-Auth\": `Bearer ${process.env.HELICONE_API_KEY}`,\n  \"Helicone-Target-URL\": \"https://generativelanguage.googleapis.com\"\n}"
    }
  ]
}
```
