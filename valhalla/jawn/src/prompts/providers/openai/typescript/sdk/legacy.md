# OpenAI Legacy TypeScript SDK Integration

## Legacy OpenAI SDK

```javascript
// Before
import { Configuration, OpenAIApi } from "openai";

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

// After
import { Configuration, OpenAIApi } from "openai";

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
  basePath: "https://oai.helicone.ai/v1",
  baseOptions: {
    headers: {
      "Helicone-Auth": `Bearer ${process.env.HELICONE_API_KEY}`,
    },
  },
});

const openai = new OpenAIApi(configuration);

// Example usage
const response = await openai.createChatCompletion({
  model: "gpt-3.5-turbo",
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
        "name": "configuration",
        "object_name": "Configuration"
      },
      "property_name": "basePath",
      "property_value": "\"https://oai.helicone.ai/v1\""
    },
    {
      "type": "add_object_property",
      "target": {
        "type": "variable_declaration",
        "name": "configuration",
        "object_name": "Configuration"
      },
      "property_name": "baseOptions",
      "property_value": "{\n  headers: {\n    \"Helicone-Auth\": `Bearer ${process.env.HELICONE_API_KEY}`\n  }\n}"
    }
  ]
}
```
