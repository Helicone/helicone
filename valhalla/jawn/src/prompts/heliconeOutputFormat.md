## Helicone Integration Format

When integrating Helicone, provide your changes in the following format:

1. Brief overview of required changes
2. List of files that need modification
3. JSON transformation blocks for each file

### JSON Format

```json
{
  "file": "path/to/file.ts",
  "transformations": [
    {
      "type": "add_import",
      "import_statement": "import { Something } from 'package';"
    },
    {
      "type": "modify_client",
      "target": "clientName",
      "changes": {
        "baseURL": "https://helicone-endpoint.com",
        "headers": {
          "Helicone-Auth": "Bearer ${process.env.HELICONE_API_KEY}"
        }
      }
    },
    {
      "type": "add_env_variable",
      "variable": "HELICONE_API_KEY"
    }
  ]
}
```

### Example

```json
{
  "file": "lib/api/openai.ts",
  "transformations": [
    {
      "type": "modify_client",
      "target": "openai",
      "changes": {
        "baseURL": "https://oai.helicone.ai/v1",
        "headers": {
          "Helicone-Auth": "Bearer ${process.env.HELICONE_API_KEY}"
        }
      }
    },
    {
      "type": "add_env_variable",
      "variable": "HELICONE_API_KEY"
    }
  ]
}
```

## Rules:

- Only modify files that are part of the integration.
- Do not add features that were not requested.
