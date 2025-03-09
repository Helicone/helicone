# OpenAI Python SDK Integration

## OpenAI v1+ SDK

```python
# Before
from openai import OpenAI

client = OpenAI(
  api_key="your-api-key-here",
)

# After
from openai import OpenAI
import os

client = OpenAI(
  api_key="your-api-key-here",
  base_url="https://oai.helicone.ai/v1",
  default_headers={
    "Helicone-Auth": f"Bearer {os.environ.get('HELICONE_API_KEY')}",
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
```

## AST Transformation

```json
{
  "file": "path/to/openai_client.py",
  "transformations": [
    {
      "type": "add_import",
      "position": "after_existing_imports",
      "import_statement": "import os"
    },
    {
      "type": "add_object_property",
      "target": {
        "type": "variable_declaration",
        "name": "client",
        "object_name": "OpenAI"
      },
      "property_name": "base_url",
      "property_value": "\"https://oai.helicone.ai/v1\""
    },
    {
      "type": "add_object_property",
      "target": {
        "type": "variable_declaration",
        "name": "client",
        "object_name": "OpenAI"
      },
      "property_name": "default_headers",
      "property_value": "{\n  \"Helicone-Auth\": f\"Bearer {os.environ.get('HELICONE_API_KEY')}\"\n}"
    }
  ]
}
```
