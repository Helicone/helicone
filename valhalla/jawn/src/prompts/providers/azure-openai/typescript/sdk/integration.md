# Azure OpenAI TypeScript SDK Integration

## Azure OpenAI SDK

```javascript
// Before
import { AzureOpenAI } from "openai";

const azureOpenai = new AzureOpenAI({
  apiKey: process.env.AZURE_OPENAI_API_KEY,
  apiVersion: process.env.AZURE_API_VERSION,
  endpoint: `https://${process.env.AZURE_DOMAIN}.openai.azure.com`,
});

// After
import { AzureOpenAI } from "openai";

const azureOpenai = new AzureOpenAI({
  apiKey: process.env.AZURE_OPENAI_API_KEY,
  apiVersion: process.env.AZURE_API_VERSION,
  baseURL: `https://oai.helicone.ai/openai/deployments/${process.env.AZURE_DEPLOYMENT_NAME}`,
  defaultHeaders: {
    "Helicone-Auth": `Bearer ${process.env.HELICONE_API_KEY}`,
    "Helicone-OpenAI-API-Base": `https://${process.env.AZURE_DOMAIN}.openai.azure.com`,
    "api-key": process.env.AZURE_OPENAI_API_KEY,
  },
});

// Example usage
const response = await azureOpenai.chat.completions.create({
  model: "gpt-4",
  messages: [{ role: "user", content: "Hello world" }],
});
```

## Required Environment Variables

```
HELICONE_API_KEY=your_helicone_api_key
AZURE_OPENAI_API_KEY=your_azure_openai_api_key
AZURE_API_VERSION=your_azure_api_version
AZURE_DOMAIN=your_azure_domain
AZURE_DEPLOYMENT_NAME=your_azure_deployment_name
```

## AST Transformation

```json
{
  "file": "path/to/azure-openai-client.ts",
  "transformations": [
    {
      "type": "add_code_after_imports",
      "code": "// Helicone API key validation\nif (!process.env.HELICONE_API_KEY) {\n  throw new Error(\"HELICONE_API_KEY is required for API monitoring\");\n}"
    },
    {
      "type": "replace_object_property",
      "target": {
        "type": "variable_declaration",
        "name": "azureOpenai",
        "object_name": "AzureOpenAI"
      },
      "property_name": "endpoint",
      "new_property_name": "baseURL",
      "property_value": "`https://oai.helicone.ai/openai/deployments/${process.env.AZURE_DEPLOYMENT_NAME}`"
    },
    {
      "type": "add_object_property",
      "target": {
        "type": "variable_declaration",
        "name": "azureOpenai",
        "object_name": "AzureOpenAI"
      },
      "property_name": "defaultHeaders",
      "property_value": "{\n  \"Helicone-Auth\": `Bearer ${process.env.HELICONE_API_KEY}`,\n  \"Helicone-OpenAI-API-Base\": `https://${process.env.AZURE_DOMAIN}.openai.azure.com`,\n  \"api-key\": process.env.AZURE_OPENAI_API_KEY\n}"
    }
  ]
}
```
