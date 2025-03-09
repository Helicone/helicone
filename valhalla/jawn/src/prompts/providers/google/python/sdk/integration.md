# Google Gemini Python SDK Integration

## Google Generative AI SDK

```python
# Before
from google import genai
import os

client = genai.Client(
    api_key=os.environ.get('GOOGLE_API_KEY')
)

# After
from google import genai
import os

client = genai.Client(
    api_key=os.environ.get('GOOGLE_API_KEY'),
    http_options={
        "base_url": 'https://gateway.helicone.ai',
        "headers": {
            "helicone-auth": f'Bearer {os.environ.get("HELICONE_API_KEY")}',
            "helicone-target-url": 'https://generativelanguage.googleapis.com'
        }
    }
)

# Generate content
response = client.models.generate_content(
    model='gemini-2.0-flash',
    contents='Tell me a story in 300 words.'
)
print(response.text)
```

## Required Environment Variables

```
HELICONE_API_KEY=your_helicone_api_key
GOOGLE_API_KEY=your_google_api_key
```

## AST Transformation

```json
{
  "file": "path/to/gemini_client.py",
  "transformations": [
    {
      "type": "add_code_after_imports",
      "code": "# Helicone API key validation\nif not os.environ.get('HELICONE_API_KEY'):\n    raise ValueError(\"HELICONE_API_KEY is required for API monitoring\")"
    },
    {
      "type": "add_object_property",
      "target": {
        "type": "variable_declaration",
        "name": "client",
        "object_name": "genai.Client"
      },
      "property_name": "http_options",
      "property_value": "{\n    \"base_url\": 'https://gateway.helicone.ai',\n    \"headers\": {\n        \"helicone-auth\": f'Bearer {os.environ.get(\"HELICONE_API_KEY\")}',\n        \"helicone-target-url\": 'https://generativelanguage.googleapis.com'\n    }\n}"
    }
  ]
}
```
