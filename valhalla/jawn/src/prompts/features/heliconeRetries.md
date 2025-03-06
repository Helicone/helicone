#### Helicone Retries Integration

Helicone's retries feature allows you to automatically retry failed LLM requests, overcoming rate limits and server issues using intelligent exponential backoff. This helps ensure your application remains resilient even when facing temporary API limitations or server problems.

##### JavaScript/TypeScript

```javascript
// Before
import { OpenAI } from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

try {
  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      {
        role: "user",
        content: "Generate a complex response that might hit rate limits.",
      },
    ],
  });
} catch (error) {
  console.error("Request failed:", error);
  // Manual retry logic would be needed here
}

// After
import { OpenAI } from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: "https://oai.helicone.ai/v1",
  defaultHeaders: {
    "Helicone-Auth": `Bearer ${process.env.HELICONE_API_KEY}`,
  },
});

// Basic retry configuration
const response = await openai.chat.completions.create(
  {
    model: "gpt-4",
    messages: [
      {
        role: "user",
        content: "Generate a complex response that might hit rate limits.",
      },
    ],
  },
  {
    headers: {
      "Helicone-Retry-Enabled": "true", // Enable automatic retries
    },
  }
);

// Advanced retry configuration
const advancedResponse = await openai.chat.completions.create(
  {
    model: "gpt-4",
    messages: [
      {
        role: "user",
        content: "Generate a complex response that might hit rate limits.",
      },
    ],
  },
  {
    headers: {
      "Helicone-Retry-Enabled": "true", // Enable automatic retries
      "helicone-retry-num": "5", // Maximum number of retry attempts
      "helicone-retry-factor": "2", // Exponential backoff factor
      "helicone-retry-min-timeout": "1000", // Minimum timeout between retries (ms)
      "helicone-retry-max-timeout": "10000", // Maximum timeout between retries (ms)
    },
  }
);
```

##### Python

```python
# Before
from openai import OpenAI

client = OpenAI(api_key="YOUR_API_KEY")

try:
    response = client.chat.completions.create(
        model="gpt-4",
        messages=[
            {
                "role": "user",
                "content": "Generate a complex response that might hit rate limits.",
            }
        ]
    )
except Exception as e:
    print(f"Request failed: {e}")
    # Manual retry logic would be needed here

# After
from openai import OpenAI

client = OpenAI(
    api_key="YOUR_API_KEY",
    base_url="https://oai.helicone.ai/v1",
    default_headers={
        "Helicone-Auth": f"Bearer {HELICONE_API_KEY}",
    }
)

# Basic retry configuration
response = client.chat.completions.create(
    model="gpt-4",
    messages=[
        {
            "role": "user",
            "content": "Generate a complex response that might hit rate limits.",
        }
    ],
    extra_headers={
        "Helicone-Retry-Enabled": "true",  # Enable automatic retries
    }
)

# Advanced retry configuration
advanced_response = client.chat.completions.create(
    model="gpt-4",
    messages=[
        {
            "role": "user",
            "content": "Generate a complex response that might hit rate limits.",
        }
    ],
    extra_headers={
        "Helicone-Retry-Enabled": "true",  # Enable automatic retries
        "helicone-retry-num": "5",  # Maximum number of retry attempts
        "helicone-retry-factor": "2",  # Exponential backoff factor
        "helicone-retry-min-timeout": "1000",  # Minimum timeout between retries (ms)
        "helicone-retry-max-timeout": "10000",  # Maximum timeout between retries (ms)
    }
)
```

#### Implementation Context

When implementing Helicone Retries, consider:

1. **Error Types**: Retries are particularly useful for handling rate limits (HTTP 429) and server errors (HTTP 500).
2. **Retry Count**: Set an appropriate maximum number of retry attempts based on your application's requirements.
3. **Backoff Strategy**: Configure the exponential backoff parameters to avoid overwhelming the server.
4. **Timeout Limits**: Set minimum and maximum timeouts to control the delay between retry attempts.
5. **Idempotency**: Ensure your requests are idempotent (can be safely retried without side effects).

#### Retry Parameters

| Parameter                    | Description                          | Default | Example   |
| ---------------------------- | ------------------------------------ | ------- | --------- |
| `helicone-retry-num`         | Maximum number of retry attempts     | 3       | `"5"`     |
| `helicone-retry-factor`      | Exponential backoff multiplier       | 2       | `"2"`     |
| `helicone-retry-min-timeout` | Minimum timeout between retries (ms) | 1000    | `"1000"`  |
| `helicone-retry-max-timeout` | Maximum timeout between retries (ms) | 10000   | `"10000"` |

#### Benefits

- Increased reliability for your LLM-powered applications
- Automatic handling of rate limits and server errors
- Reduced need for complex error handling in your code
- Intelligent backoff strategy to maximize success rate
- Visibility into retry attempts through Helicone's dashboard
