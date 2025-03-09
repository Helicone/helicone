# Google Gemini TypeScript Direct API Integration (Fetch)

## Fetch API Integration

```javascript
// Before
const response = await fetch(
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": process.env.GEMINI_API_KEY,
    },
    body: JSON.stringify({
      contents: [
        { parts: [{ text: "Write a story about a magic backpack." }] },
      ],
    }),
  }
);

// After
const url = `https://gateway.helicone.ai/v1beta/models/gemini-pro:generateContent?key=${process.env.GOOGLE_API_KEY}`;

const headers = {
  "Content-Type": "application/json",
  "Helicone-Auth": `Bearer ${process.env.HELICONE_API_KEY}`,
  "Helicone-Target-URL": "https://generativelanguage.googleapis.com",
};

const body = JSON.stringify({
  contents: [
    {
      parts: [
        {
          text: "Write a story about a magic backpack.",
        },
      ],
    },
  ],
});

const response = await fetch(url, {
  method: "POST",
  headers: headers,
  body: body,
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
  "file": "path/to/gemini-fetch-client.ts",
  "transformations": [
    {
      "type": "add_code_after_imports",
      "code": "// Helicone API key validation\nif (!process.env.HELICONE_API_KEY) {\n  throw new Error(\"HELICONE_API_KEY is required for API monitoring\");\n}"
    },
    {
      "type": "replace_code_block",
      "target": {
        "type": "function_call",
        "function_name": "fetch"
      },
      "code": "const url = `https://gateway.helicone.ai/v1beta/models/gemini-pro:generateContent?key=${process.env.GOOGLE_API_KEY}`;\n\nconst headers = {\n  \"Content-Type\": \"application/json\",\n  \"Helicone-Auth\": `Bearer ${process.env.HELICONE_API_KEY}`,\n  \"Helicone-Target-URL\": \"https://generativelanguage.googleapis.com\",\n};\n\nconst body = JSON.stringify({\n  contents: [\n    {\n      parts: [\n        {\n          text: \"Write a story about a magic backpack.\",\n        },\n      ],\n    },\n  ],\n});\n\nconst response = await fetch(url, {\n  method: \"POST\",\n  headers: headers,\n  body: body,\n});"
    }
  ]
}
```
