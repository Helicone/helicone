#### Helicone Custom Rate Limits Integration

Helicone's Custom Rate Limits feature allows you to set custom rate limits for model provider API calls. You can control usage by request count, cost, or custom properties to manage expenses and prevent unintended overuse.

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
      content: "Generate a response that consumes tokens.",
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

// Global rate limit (10,000 requests per hour)
const response = await openai.chat.completions.create(
  {
    model: "gpt-4",
    messages: [
      {
        role: "user",
        content: "Generate a response that consumes tokens.",
      },
    ],
  },
  {
    headers: {
      "Helicone-RateLimit-Policy": "10000;w=3600", // 10,000 requests per 3600 seconds (1 hour)
    },
  }
);

// User-specific rate limit (500 requests per day)
const userResponse = await openai.chat.completions.create(
  {
    model: "gpt-4",
    messages: [
      {
        role: "user",
        content: "Generate a response that consumes tokens.",
      },
    ],
  },
  {
    headers: {
      "Helicone-User-Id": "user_123", // Identify the user
      "Helicone-RateLimit-Policy": "500;w=86400;s=user", // 500 requests per 86400 seconds (1 day) per user
    },
  }
);

// Cost-based rate limit (10 cents per 15 minutes)
const costResponse = await openai.chat.completions.create(
  {
    model: "gpt-4",
    messages: [
      {
        role: "user",
        content: "Generate a response that consumes tokens.",
      },
    ],
  },
  {
    headers: {
      "Helicone-RateLimit-Policy": "10;w=900;u=cents", // 10 cents per 900 seconds (15 minutes)
    },
  }
);

// Custom property rate limit (300 requests per 30 minutes for a specific feature)
const propertyResponse = await openai.chat.completions.create(
  {
    model: "gpt-4",
    messages: [
      {
        role: "user",
        content: "Generate a response that consumes tokens.",
      },
    ],
  },
  {
    headers: {
      "Helicone-Property-Feature": "content_generator", // Define the custom property
      "Helicone-RateLimit-Policy": "300;w=1800;s=Feature", // 300 requests per 1800 seconds (30 minutes) per Feature
    },
  }
);

// Extracting rate limit information from response
const { data, response: rawResponse } = await openai.chat.completions
  .create(
    {
      model: "gpt-4",
      messages: [
        {
          role: "user",
          content: "Generate a response that consumes tokens.",
        },
      ],
    },
    {
      headers: {
        "Helicone-RateLimit-Policy": "10000;w=3600",
      },
    }
  )
  .withResponse();

const rateLimit = rawResponse.headers.get("Helicone-RateLimit-Limit");
const rateLimitRemaining = rawResponse.headers.get(
  "Helicone-RateLimit-Remaining"
);
const rateLimitPolicy = rawResponse.headers.get("Helicone-RateLimit-Policy");

console.log(
  `Rate limit: ${rateLimit}, Remaining: ${rateLimitRemaining}, Policy: ${rateLimitPolicy}`
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
            "content": "Generate a response that consumes tokens.",
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

# Global rate limit (10,000 requests per hour)
response = client.chat.completions.create(
    model="gpt-4",
    messages=[
        {
            "role": "user",
            "content": "Generate a response that consumes tokens.",
        }
    ],
    extra_headers={
        "Helicone-RateLimit-Policy": "10000;w=3600",  # 10,000 requests per 3600 seconds (1 hour)
    }
)

# User-specific rate limit (500 requests per day)
user_response = client.chat.completions.create(
    model="gpt-4",
    messages=[
        {
            "role": "user",
            "content": "Generate a response that consumes tokens.",
        }
    ],
    extra_headers={
        "Helicone-User-Id": "user_123",  # Identify the user
        "Helicone-RateLimit-Policy": "500;w=86400;s=user",  # 500 requests per 86400 seconds (1 day) per user
    }
)

# Cost-based rate limit (10 cents per 15 minutes)
cost_response = client.chat.completions.create(
    model="gpt-4",
    messages=[
        {
            "role": "user",
            "content": "Generate a response that consumes tokens.",
        }
    ],
    extra_headers={
        "Helicone-RateLimit-Policy": "10;w=900;u=cents",  # 10 cents per 900 seconds (15 minutes)
    }
)

# Custom property rate limit (300 requests per 30 minutes for a specific feature)
property_response = client.chat.completions.create(
    model="gpt-4",
    messages=[
        {
            "role": "user",
            "content": "Generate a response that consumes tokens.",
        }
    ],
    extra_headers={
        "Helicone-Property-Feature": "content_generator",  # Define the custom property
        "Helicone-RateLimit-Policy": "300;w=1800;s=Feature",  # 300 requests per 1800 seconds (30 minutes) per Feature
    }
)

# Extracting rate limit information from response
chat_completion_raw = client.chat.completions.with_raw_response.create(
    model="gpt-4",
    messages=[
        {
            "role": "user",
            "content": "Generate a response that consumes tokens.",
        }
    ],
    extra_headers={
        "Helicone-RateLimit-Policy": "10000;w=3600",
    }
)

# Get the parsed response
chat_completion = chat_completion_raw.parse()

# Get rate limit information from headers
rate_limit = chat_completion_raw.http_response.headers.get("Helicone-RateLimit-Limit")
rate_limit_remaining = chat_completion_raw.http_response.headers.get("Helicone-RateLimit-Remaining")
rate_limit_policy = chat_completion_raw.http_response.headers.get("Helicone-RateLimit-Policy")

print(f"Rate limit: {rate_limit}, Remaining: {rate_limit_remaining}, Policy: {rate_limit_policy}")
```

#### Implementation Context

When implementing Helicone Custom Rate Limits, consider:

1. **Rate Limit Scope**: Decide whether to apply limits globally, per user, or by custom property.
2. **Time Windows**: Choose appropriate time windows based on your usage patterns (e.g., per minute, hour, day).
3. **Limit Types**: Determine whether to limit by request count or cost.
4. **User Identification**: Ensure consistent user identification when using user-specific rate limits.
5. **Custom Properties**: Define meaningful custom properties for segmented rate limiting.

#### Rate Limit Policy Format

The rate limit policy follows this format: `[quota];w=[time_window];u=[unit];s=[segment]`

| Parameter         | Description                                 | Default     | Example                          |
| ----------------- | ------------------------------------------- | ----------- | -------------------------------- |
| `quota`           | Maximum number of requests or cents allowed | Required    | `"1000"`                         |
| `w` (time_window) | Time window in seconds                      | Required    | `"3600"` (1 hour)                |
| `u` (unit)        | Unit of measurement                         | `"request"` | `"cents"` or `"request"`         |
| `s` (segment)     | Scope of the rate limit                     | Global      | `"user"` or custom property name |

#### Benefits

- Prevent abuse of your API keys
- Control operational costs by limiting usage
- Apply different limits to different users or features
- Monitor usage patterns and remaining quota
- Comply with third-party API usage policies
