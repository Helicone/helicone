# Azure OpenAI Python LangChain Integration

## LangChain Integration

```python
# Before
from langchain.chat_models import AzureChatOpenAI

model = AzureChatOpenAI(
  openai_api_base=f"https://{azure_domain}.openai.azure.com",
  deployment_name="gpt-35-turbo",
  openai_api_key=os.getenv("AZURE_OPENAI_API_KEY"),
  openai_api_version="2023-05-15",
  openai_api_type="azure",
)

# After
from langchain.chat_models import AzureChatOpenAI
import os

helicone_headers = {
  "Helicone-Auth": f"Bearer {os.getenv('HELICONE_API_KEY')}",
  "Helicone-OpenAI-Api-Base": f"https://{os.getenv('AZURE_DOMAIN')}.openai.azure.com"
}

model = AzureChatOpenAI(
  openai_api_base="https://oai.helicone.ai",
  deployment_name="gpt-35-turbo",
  openai_api_key=os.getenv("AZURE_OPENAI_API_KEY"),
  openai_api_version="2023-05-15",
  openai_api_type="azure",
  headers=helicone_headers,
)
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
  "file": "path/to/azure_langchain_client.py",
  "transformations": [
    {
      "type": "add_import",
      "position": "after_existing_imports",
      "import_statement": "import os"
    },
    {
      "type": "add_code_after_imports",
      "code": "# Helicone API key validation\nif not os.environ.get('HELICONE_API_KEY'):\n    raise ValueError(\"HELICONE_API_KEY is required for API monitoring\")\n\nhelicone_headers = {\n  \"Helicone-Auth\": f\"Bearer {os.getenv('HELICONE_API_KEY')}\",\n  \"Helicone-OpenAI-Api-Base\": f\"https://{os.getenv('AZURE_DOMAIN')}.openai.azure.com\"\n}"
    },
    {
      "type": "replace_object_property",
      "target": {
        "type": "variable_declaration",
        "name": "model",
        "object_name": "AzureChatOpenAI"
      },
      "property_name": "openai_api_base",
      "property_value": "\"https://oai.helicone.ai\""
    },
    {
      "type": "add_object_property",
      "target": {
        "type": "variable_declaration",
        "name": "model",
        "object_name": "AzureChatOpenAI"
      },
      "property_name": "headers",
      "property_value": "helicone_headers"
    }
  ]
}
```
