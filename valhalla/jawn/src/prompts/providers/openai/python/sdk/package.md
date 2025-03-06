# OpenAI Python Package Integration

## Helicone Package Integration

```python
# Before
import openai

# After
from helicone.openai_proxy import openai  # replace `import openai` with this line

# Example usage
response = openai.ChatCompletion.create(
  model="gpt-3.5-turbo",
  messages=[
    {"role": "user", "content": "Hello world"}
  ]
)
```

## Required Environment Variables

```
HELICONE_API_KEY=your_helicone_api_key
```

## Required Package Installation

```
pip install helicone
```

## AST Transformation

```json
{
  "file": "path/to/openai_client.py",
  "transformations": [
    {
      "type": "add_import",
      "position": "start",
      "import_statement": "from helicone.openai_proxy import openai  # replace `import openai` with this line"
    },
    {
      "type": "remove_import",
      "import_statement": "import openai"
    }
  ]
}
```
