# Azure OpenAI Python SDK Integration

## Azure OpenAI SDK

```python
# Before
from openai import AzureOpenAI

client = AzureOpenAI(
  api_key=os.getenv("AZURE_OPENAI_API_KEY"),
  azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT"),
  api_version="2023-05-15"
)

# After (OpenAI v1+)
from openai import OpenAI
import os

client = OpenAI(
  api_key=os.getenv("AZURE_OPENAI_API_KEY"),
  base_url=f"https://oai.helicone.ai/openai/deployments/{os.getenv('AZURE_DEPLOYMENT_NAME')}",
  default_headers={
    "Helicone-OpenAI-Api-Base": f"https://{os.getenv('AZURE_DOMAIN')}.openai.azure.com",
    "Helicone-Auth": f"Bearer {os.getenv('HELICONE_API_KEY')}",
    "api-key": os.getenv("AZURE_OPENAI_API_KEY"),
  },
  default_query={
    "api-version": os.getenv("AZURE_API_VERSION")
  }
)

# Example usage
response = client.chat.completions.create(
  model="gpt-4",
  messages=[
    {"role": "user", "content": "Hello world"}
  ]
)
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
  "file": "path/to/azure_openai_client.py",
  "transformations": [
    {
      "type": "replace_import",
      "old_import": "from openai import AzureOpenAI",
      "new_import": "from openai import OpenAI\nimport os"
    },
    {
      "type": "add_code_after_imports",
      "code": "# Helicone API key validation\nif not os.environ.get('HELICONE_API_KEY'):\n    raise ValueError(\"HELICONE_API_KEY is required for API monitoring\")"
    },
    {
      "type": "replace_variable_declaration",
      "target": {
        "type": "variable_declaration",
        "name": "client",
        "object_name": "AzureOpenAI"
      },
      "code": "client = OpenAI(\n  api_key=os.getenv(\"AZURE_OPENAI_API_KEY\"),\n  base_url=f\"https://oai.helicone.ai/openai/deployments/{os.getenv('AZURE_DEPLOYMENT_NAME')}\",\n  default_headers={\n    \"Helicone-OpenAI-Api-Base\": f\"https://{os.getenv('AZURE_DOMAIN')}.openai.azure.com\",\n    \"Helicone-Auth\": f\"Bearer {os.getenv('HELICONE_API_KEY')}\",\n    \"api-key\": os.getenv(\"AZURE_OPENAI_API_KEY\"),\n  },\n  default_query={\n    \"api-version\": os.getenv(\"AZURE_API_VERSION\")\n  }\n)"
    }
  ]
}
```
