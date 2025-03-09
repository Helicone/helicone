# Anthropic Python SDK Integration

## Anthropic SDK

```python
# Before
import anthropic
import os

client = anthropic.Anthropic(
  api_key=os.environ.get("ANTHROPIC_API_KEY"),
)

# After
import anthropic
import os

client = anthropic.Anthropic(
  api_key=os.environ.get("ANTHROPIC_API_KEY"),
  base_url="https://anthropic.helicone.ai",
  default_headers={
    "Helicone-Auth": f"Bearer {os.environ.get('HELICONE_API_KEY')}",
  },
)

# Example usage
client.messages.create(
  model="claude-3-opus-20240229",
  max_tokens=1024,
  messages=[
    {"role": "user", "content": "Hello, world"}
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
  "file": "path/to/anthropic_client.py",
  "transformations": [
    {
      "type": "add_object_property",
      "target": {
        "type": "variable_declaration",
        "name": "client",
        "object_name": "anthropic.Anthropic"
      },
      "property_name": "base_url",
      "property_value": "\"https://anthropic.helicone.ai\""
    },
    {
      "type": "add_object_property",
      "target": {
        "type": "variable_declaration",
        "name": "client",
        "object_name": "anthropic.Anthropic"
      },
      "property_name": "default_headers",
      "property_value": "{\n  \"Helicone-Auth\": f\"Bearer {os.environ.get('HELICONE_API_KEY')}\"\n}"
    }
  ]
}
```
