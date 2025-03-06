# Google Gemini Python Vertex AI Integration

## Vertex AI Integration

```python
# Before
import vertexai
from vertexai.generative_models import GenerativeModel

vertexai.init(project="your-project-id", location="your-location")
model = GenerativeModel("gemini-1.5-flash-001")

# After
import vertexai
from vertexai.generative_models import GenerativeModel
import os

HELICONE_API_KEY = os.environ.get("HELICONE_API_KEY")
PROJECT_ID = os.environ.get("PROJECT_ID")
LOCATION = os.environ.get("LOCATION")

vertexai.init(
    project=PROJECT_ID,
    location=LOCATION,
    api_endpoint="gateway.helicone.ai",
    api_transport="rest",  # Must be 'rest' or else it will not work
    request_metadata=[
        ('helicone-target-url', f'https://{LOCATION}-aiplatform.googleapis.com'),
        ('helicone-auth', f'Bearer {HELICONE_API_KEY}')
    ]
)

model = GenerativeModel("gemini-1.5-flash-001")
response = model.generate_content("Tell me a fun fact about space.")
print(response.text)
```

## Required Environment Variables

```
HELICONE_API_KEY=your_helicone_api_key
PROJECT_ID=your_google_cloud_project_id
LOCATION=your_google_cloud_location
```

## AST Transformation

```json
{
  "file": "path/to/vertex_ai_client.py",
  "transformations": [
    {
      "type": "add_import",
      "position": "after_existing_imports",
      "import_statement": "import os"
    },
    {
      "type": "add_code_after_imports",
      "code": "# Helicone API key validation\nif not os.environ.get('HELICONE_API_KEY'):\n    raise ValueError(\"HELICONE_API_KEY is required for API monitoring\")\n\nHELICONE_API_KEY = os.environ.get(\"HELICONE_API_KEY\")\nPROJECT_ID = os.environ.get(\"PROJECT_ID\")\nLOCATION = os.environ.get(\"LOCATION\")"
    },
    {
      "type": "replace_function_call",
      "target": {
        "type": "function_call",
        "function_name": "vertexai.init"
      },
      "code": "vertexai.init(\n    project=PROJECT_ID,\n    location=LOCATION,\n    api_endpoint=\"gateway.helicone.ai\",\n    api_transport=\"rest\",  # Must be 'rest' or else it will not work\n    request_metadata=[\n        ('helicone-target-url', f'https://{LOCATION}-aiplatform.googleapis.com'),\n        ('helicone-auth', f'Bearer {HELICONE_API_KEY}')\n    ]\n)"
    }
  ]
}
```
