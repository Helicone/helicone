# Azure OpenAI TypeScript LangChain Integration

## LangChain Integration

```javascript
// Before
const model = new ChatOpenAI({
  azureOpenAIApiKey: process.env.AZURE_OPENAI_API_KEY,
  azureOpenAIApiDeploymentName: "openai/deployments/gpt-35-turbo",
  azureOpenAIApiVersion: "2023-03-15-preview",
  azureOpenAIBasePath: `https://${process.env.AZURE_DOMAIN}.openai.azure.com`,
});

// After
const model = new ChatOpenAI({
  azureOpenAIApiKey: process.env.AZURE_OPENAI_API_KEY,
  azureOpenAIApiDeploymentName: "openai/deployments/gpt-35-turbo",
  azureOpenAIApiVersion: "2023-03-15-preview",
  azureOpenAIBasePath: "https://oai.helicone.ai",
  configuration: {
    baseOptions: {
      headers: {
        "Helicone-Auth": `Bearer ${process.env.HELICONE_API_KEY}`,
        "Helicone-OpenAI-Api-Base": `https://${process.env.AZURE_DOMAIN}.openai.azure.com`,
      },
    },
  },
});
```

## Required Environment Variables

```
HELICONE_API_KEY=your_helicone_api_key
AZURE_OPENAI_API_KEY=your_azure_openai_api_key
AZURE_DOMAIN=your_azure_domain
```

## AST Transformation

```json
{
  "file": "path/to/azure-langchain-client.ts",
  "transformations": [
    {
      "type": "add_code_after_imports",
      "code": "// Helicone API key validation\nif (!process.env.HELICONE_API_KEY) {\n  throw new Error(\"HELICONE_API_KEY is required for API monitoring\");\n}"
    },
    {
      "type": "replace_object_property",
      "target": {
        "type": "variable_declaration",
        "name": "model",
        "object_name": "ChatOpenAI"
      },
      "property_name": "azureOpenAIBasePath",
      "property_value": "\"https://oai.helicone.ai\""
    },
    {
      "type": "add_object_property",
      "target": {
        "type": "variable_declaration",
        "name": "model",
        "object_name": "ChatOpenAI"
      },
      "property_name": "configuration",
      "property_value": "{\n  baseOptions: {\n    headers: {\n      \"Helicone-Auth\": `Bearer ${process.env.HELICONE_API_KEY}`,\n      \"Helicone-OpenAI-Api-Base\": `https://${process.env.AZURE_DOMAIN}.openai.azure.com`,\n    },\n  },\n}"
    }
  ]
}
```
