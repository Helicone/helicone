# OpenRouter Integration with Helicone

## Basic Integration

### Endpoint Change

Replace the OpenRouter API endpoint with the Helicone proxy endpoint:

```diff
- https://openrouter.ai/api/v1/chat/completions
+ https://openrouter.helicone.ai/api/v1/chat/completions
```

### Required Headers

Add the following header to your requests:

```
Helicone-Auth: Bearer ${HELICONE_API_KEY}
```

## Integration Examples

### Using the OpenAI SDK

```python
from openai import OpenAI

# Before
client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key="<OPENROUTER_API_KEY>",
)

# After
client = OpenAI(
    base_url="https://openrouter.helicone.ai/api/v1",
    api_key="<OPENROUTER_API_KEY>",
)

completion = client.chat.completions.create(
    extra_headers={
        "HTTP-Referer": "<YOUR_SITE_URL>",
    },
    model="openai/gpt-4o",
    messages=[
        {
            "role": "user",
            "content": "What is the meaning of life?"
        }
    ]
)
```

### Using the OpenRouter API Directly

```python
import requests
import json

# Before
response = requests.post(
    url="https://openrouter.ai/api/v1/chat/completions",
    headers={
        "Authorization": "Bearer <OPENROUTER_API_KEY>",
    },
    data=json.dumps({
        "model": "openai/gpt-4o",
        "messages": [
            {
                "role": "user",
                "content": "What is the meaning of life?"
            }
        ]
    })
)

# After
response = requests.post(
    url="https://openrouter.helicone.ai/api/v1/chat/completions",
    headers={
        "Authorization": "Bearer <OPENROUTER_API_KEY>",
        "Helicone-Auth": "Bearer ${HELICONE_API_KEY}",
    },
    data=json.dumps({
        "model": "openai/gpt-4o",
        "messages": [
            {
                "role": "user",
                "content": "What is the meaning of life?"
            }
        ]
    })
)
```
