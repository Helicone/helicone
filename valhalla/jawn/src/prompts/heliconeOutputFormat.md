## Helicone Integration Format

JSON blocks for each file with exact text replacements

### JSON Format

```json
{
  "file": "path/to/file.ts",
  "replacements": [
    {
      "from": "const client = createClient({\n  apiKey: process.env.API_KEY\n});",
      "to": "const client = createClient({\n  apiKey: process.env.API_KEY,\n  baseURL: \"https://helicone-endpoint.com\",\n  headers: {\n    \"Helicone-Auth\": `Bearer ${process.env.HELICONE_API_KEY}`\n  }\n});"
    }
  ]
}
```

For files that need to be created (like .env.example):

```json
{
  "file": ".env.example",
  "content": "# API Keys\nAPI_KEY=\n\n# Helicone Configuration\nHELICONE_API_KEY="
}
```

## CRITICAL: For successful replacements

- **ANALYZE THE ACTUAL CODE CAREFULLY**: Open and examine each file before suggesting replacements
- **COPY-PASTE EXACT CODE**: Use the exact code from the file for the "from" field, including all indentation, whitespace, and line breaks
- **VERIFY BEFORE SUBMITTING**: Confirm your "from" text exists in the file verbatim by searching for it
- **INCLUDE CONTEXT**: Provide enough surrounding code to ensure unique matches
- **AVOID ASSUMPTIONS**: Don't assume code structure - verify it in the actual files
