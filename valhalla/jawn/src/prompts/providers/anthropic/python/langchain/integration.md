# Anthropic Python LangChain Integration

## LangChain Integration

```python
# Before
anthropic = ChatAnthropic(
  temperature=0.9,
  model="claude-2",
  anthropic_api_key="ANTHROPIC_API_KEY",
)

# After
anthropic = ChatAnthropic(
  temperature=0.9,
  model="claude-2",
  anthropic_api_url="https://anthropic.helicone.ai",
  anthropic_api_key="ANTHROPIC_API_KEY",
  model_kwargs={
    "extra_headers":{
      "Helicone-Auth": f"Bearer {HELICONE_API_KEY}"
    }
  }
)
```

## Required Environment Variables

```
HELICONE_API_KEY=your_helicone_api_key
```

## AST Transformation

```json
{
  "file": "path/to/langchain_client.py",
  "transformations": [
    {
      "type": "add_object_property",
      "target": {
        "type": "variable_declaration",
        "name": "anthropic",
        "object_name": "ChatAnthropic"
      },
      "property_name": "anthropic_api_url",
      "property_value": "\"https://anthropic.helicone.ai\""
    },
    {
      "type": "add_object_property",
      "target": {
        "type": "variable_declaration",
        "name": "anthropic",
        "object_name": "ChatAnthropic"
      },
      "property_name": "model_kwargs",
      "property_value": "{\n  \"extra_headers\":{\n    \"Helicone-Auth\": f\"Bearer {os.environ.get('HELICONE_API_KEY')}\"\n  }\n}"
    }
  ]
}
```
