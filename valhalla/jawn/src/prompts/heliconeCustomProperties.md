#### Helicone Custom Properties Integration

Custom Properties allow you to add any additional metadata to your LLM requests for advanced segmentation and analysis. You can tag requests with session IDs, conversation context, or application data to gain deeper insights into your AI application performance.

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
      content: "Generate ideas for a mobile app.",
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
    // Global properties that apply to all requests
    "Helicone-Property-App": "idea_generator",
    "Helicone-Property-Environment": "production",
  },
});

// Request-specific properties
const response = await openai.chat.completions.create(
  {
    model: "gpt-4",
    messages: [
      {
        role: "user",
        content: "Generate ideas for a mobile app.",
      },
    ],
  },
  {
    headers: {
      "Helicone-Property-Category": "mobile",
      "Helicone-Property-UserType": "developer",
      "Helicone-Property-RequestPhase": "ideation",
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
            "content": "Generate ideas for a mobile app.",
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
        # Global properties that apply to all requests
        "Helicone-Property-App": "idea_generator",
        "Helicone-Property-Environment": "production",
    }
)

# Request-specific properties
response = client.chat.completions.create(
    model="gpt-4",
    messages=[
        {
            "role": "user",
            "content": "Generate ideas for a mobile app.",
        }
    ],
    extra_headers={
        "Helicone-Property-Category": "mobile",
        "Helicone-Property-UserType": "developer",
        "Helicone-Property-RequestPhase": "ideation",
    }
)
```

#### Implementation Context

When implementing Helicone Custom Properties, consider:

1. **Property Naming**: Choose descriptive property names that reflect the data you're tracking.
2. **Value Types**: Property values should be strings that provide meaningful labels.
3. **Global vs. Request-Specific**: Decide which properties should apply to all requests (in default headers) and which should be request-specific.
4. **Consistent Usage**: Use consistent property names and values across your application for better analysis.
5. **Hierarchical Properties**: Consider using hierarchical naming for related properties (e.g., `UserLevel-Basic`, `UserLevel-Premium`).

#### Common Use Cases

- **Application Context**: Track which part of your application is making the request (`Helicone-Property-Feature: "chatbot"`)
- **User Segmentation**: Categorize requests by user type (`Helicone-Property-UserType: "free_tier"`)
- **Business Logic**: Track business-specific information (`Helicone-Property-Department: "support"`)
- **Request Purpose**: Identify the purpose of each request (`Helicone-Property-Intent: "question_answering"`)
- **A/B Testing**: Tag requests for different experiments (`Helicone-Property-Experiment: "prompt_variation_1"`)

#### Benefits

- Get the total cost or latency for a group of requests in a prompt chain
- Calculate the "unit economics" of your application (e.g., average cost per conversation)
- Slice and dice your requests and metrics by any custom property
- Identify patterns and optimize performance for specific segments of your application
