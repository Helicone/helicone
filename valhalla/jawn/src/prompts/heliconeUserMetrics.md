#### Helicone User Metrics Integration

User Metrics in Helicone allow you to monitor individual user interactions with your LLM applications. You can track per-user request volumes, costs, and usage patterns across your AI services to gain detailed insights into user activity.

##### JavaScript/TypeScript

```javascript
// Before
import { OpenAI } from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const response = await openai.chat.completions.create({
  model: "gpt-4",
  messages: [
    {
      role: "user",
      content: "Summarize this article for me.",
    },
  ],
});

// After
import { OpenAI } from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: "https://oai.helicone.ai/v1",
  defaultHeaders: {
    "Helicone-Auth": `Bearer ${process.env.HELICONE_API_KEY}`,
  },
});

// Option 1: Using OpenAI's user parameter
const response = await openai.chat.completions.create({
  model: "gpt-4",
  messages: [
    {
      role: "user",
      content: "Summarize this article for me.",
    },
  ],
  user: "user_123", // OpenAI's built-in user identifier
});

// Option 2: Using Helicone's user ID header
const response2 = await openai.chat.completions.create(
  {
    model: "gpt-4",
    messages: [
      {
        role: "user",
        content: "Summarize this article for me.",
      },
    ],
  },
  {
    headers: {
      "Helicone-User-Id": "user_123@example.com", // Helicone's user identifier
    },
  }
);
```

##### Python

```python
# Before
from openai import OpenAI

client = OpenAI(api_key="YOUR_API_KEY")

response = client.chat.completions.create(
    model="gpt-4",
    messages=[
        {
            "role": "user",
            "content": "Summarize this article for me.",
        }
    ]
)

# After
from openai import OpenAI

client = OpenAI(
    api_key="YOUR_API_KEY",
    base_url="https://oai.helicone.ai/v1",
    default_headers={
        "Helicone-Auth": f"Bearer {HELICONE_API_KEY}",
    }
)

# Option 1: Using OpenAI's user parameter
response = client.chat.completions.create(
    model="gpt-4",
    messages=[
        {
            "role": "user",
            "content": "Summarize this article for me.",
        }
    ],
    user="user_123"  # OpenAI's built-in user identifier
)

# Option 2: Using Helicone's user ID header
response2 = client.chat.completions.create(
    model="gpt-4",
    messages=[
        {
            "role": "user",
            "content": "Summarize this article for me.",
        }
    ],
    extra_headers={
        "Helicone-User-Id": "user_123@example.com",  # Helicone's user identifier
    }
)
```

#### Implementation Context

When implementing Helicone User Metrics, consider:

1. **User Identification**: Choose a consistent method for identifying users across requests.
2. **User ID Format**: Use meaningful identifiers that help you recognize users in the dashboard.
3. **Privacy Considerations**: Consider using hashed or anonymized identifiers if privacy is a concern.
4. **Combining with Custom Properties**: Enhance user metrics by adding custom properties that provide additional context.

#### Benefits

- Gain detailed insights into individual user activity
- Track per-user request volumes, costs, and usage patterns
- Optimize resource allocation based on user-specific trends
- Identify power users and potential abuse
- Understand how different user segments interact with your AI features
