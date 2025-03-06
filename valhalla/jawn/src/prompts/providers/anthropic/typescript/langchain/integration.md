# Anthropic TypeScript LangChain Integration

## LangChain Integration

```javascript
// Before
const llm = new ChatAnthropic({
  modelName: "claude-2",
  anthropicApiKey: "ANTHROPIC_API_KEY",
});

// After
const llm = new ChatAnthropic({
  modelName: "claude-2",
  anthropicApiKey: "ANTHROPIC_API_KEY",
  clientOptions: {
    baseURL: "https://anthropic.helicone.ai",
    defaultHeaders: {
      "Helicone-Auth": `Bearer ${HELICONE_API_KEY}`,
    },
  },
});
```

## Required Environment Variables

```
HELICONE_API_KEY=your_helicone_api_key
```

## AST Transformation

```json
{
  "file": "path/to/langchain-client.ts",
  "transformations": [
    {
      "type": "add_code_after_imports",
      "code": "// Helicone API key validation\nif (!process.env.HELICONE_API_KEY) {\n  throw new Error(\"HELICONE_API_KEY is required for API monitoring\");\n}"
    },
    {
      "type": "add_object_property",
      "target": {
        "type": "variable_declaration",
        "name": "llm",
        "object_name": "ChatAnthropic"
      },
      "property_name": "clientOptions",
      "property_value": "{\n  baseURL: \"https://anthropic.helicone.ai\",\n  defaultHeaders: {\n    \"Helicone-Auth\": `Bearer ${process.env.HELICONE_API_KEY}`\n  }\n}"
    }
  ]
}
```
