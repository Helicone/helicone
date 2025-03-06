# Google Gemini TypeScript SDK Integration

## Google Generative AI SDK

```javascript
// Before
import { GoogleGenerativeAI } from "@google/generative-ai";
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// After
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize the client with Helicone integration
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

// Configure model parameters
const modelParams = {
  model: "gemini-2.0-flash",
  systemInstruction:
    "You are a helpful assistant that can answer questions and help with tasks.",
};

// Create model instance with Helicone integration
const modelInstance = genAI.getGenerativeModel(modelParams, {
  baseUrl: "https://gateway.helicone.ai",
  customHeaders: {
    "Helicone-Auth": `Bearer ${process.env.HELICONE_API_KEY}`,
    "Helicone-Target-URL": "https://generativelanguage.googleapis.com",
  },
});

// Generate content
async function generateContent() {
  const response = await modelInstance.generateContent("Hello, world!");
  console.log(response.text());
}
```

## Required Environment Variables

```
HELICONE_API_KEY=your_helicone_api_key
GOOGLE_API_KEY=your_google_api_key
```

## AST Transformation

```json
{
  "file": "path/to/gemini-client.ts",
  "transformations": [
    {
      "type": "add_code_after_imports",
      "code": "// Helicone API key validation\nif (!process.env.HELICONE_API_KEY) {\n  throw new Error(\"HELICONE_API_KEY is required for API monitoring\");\n}"
    },
    {
      "type": "add_variable_declaration",
      "code": "// Configure model parameters\nconst modelParams = {\n  model: \"gemini-2.0-flash\",\n  systemInstruction: \"You are a helpful assistant that can answer questions and help with tasks.\",\n};"
    },
    {
      "type": "add_variable_declaration",
      "code": "// Create model instance with Helicone integration\nconst modelInstance = genAI.getGenerativeModel(modelParams, {\n  baseUrl: \"https://gateway.helicone.ai\",\n  customHeaders: {\n    \"Helicone-Auth\": `Bearer ${process.env.HELICONE_API_KEY}`,\n    \"Helicone-Target-URL\": \"https://generativelanguage.googleapis.com\",\n  },\n});"
    }
  ]
}
```
