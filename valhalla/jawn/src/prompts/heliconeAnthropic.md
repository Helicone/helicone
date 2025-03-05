#### Anthropic Integration

##### JavaScript/TypeScript

```javascript
// Before
import Anthropic from "@anthropic-ai/sdk";
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// After
import Anthropic from "@anthropic-ai/sdk";
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  baseURL: "https://anthropic.helicone.ai",
  defaultHeaders: {
    "Helicone-Auth": "Bearer your_helicone_api_key",
  },
});
```

##### Python

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

client.messages.create(
  model="claude-3-opus-20240229",
  max_tokens=1024,
  messages=[
    {"role": "user", "content": "Hello, world"}
  ]
)
```

##### LangChain (JavaScript/TypeScript)

```javascript
// Before
const llm = new ChatAnthropic({
  modelName: "claude-2",
  anthropicApiKey: "ANTHROPIC_API_KEY",
});

// After
const llm = new ChatAnthropic({
  modelName: "claude-2",
  anthropicApiKey: "ANTHROPIC_API_KEY",
  clientOptions: {
    baseURL: "https://anthropic.helicone.ai",
    defaultHeaders: {
      "Helicone-Auth": `Bearer ${HELICONE_API_KEY}`,
    },
  },
});
```

##### LangChain (Python)

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
