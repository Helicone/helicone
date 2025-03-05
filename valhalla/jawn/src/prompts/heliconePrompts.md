#### Helicone Prompts Integration

Helicone Prompts allows you to version, track, and optimize your prompts. This feature helps you manage prompt templates with variables and track their performance over time.

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
      content: `Write a story about ${character} set in ${location}`,
    },
  ],
});

// After
import { OpenAI } from "openai";
import { hpf } from "@helicone/prompts"; // Import the Helicone Prompts package

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: "https://oai.helicone.ai/v1",
  defaultHeaders: {
    "Helicone-Auth": `Bearer ${process.env.HELICONE_API_KEY}`,
  },
});

const character = "a detective";
const location = "Paris";

const response = await openai.chat.completions.create(
  {
    model: "gpt-4",
    messages: [
      {
        role: "user",
        content: hpf`Write a story about ${{ character }} set in ${{
          location,
        }}`,
      },
    ],
  },
  {
    headers: {
      "Helicone-Prompt-Id": "story_generator", // Assign a unique ID to your prompt
    },
  }
);
```

##### Python

```python
# Before
from openai import OpenAI

client = OpenAI(api_key="YOUR_API_KEY")

character = "a detective"
location = "Paris"

response = client.chat.completions.create(
    model="gpt-4",
    messages=[
        {
            "role": "user",
            "content": f"Write a story about {character} set in {location}",
        }
    ]
)

# After
from openai import OpenAI
from helicone_prompts import hpf  # Import the Helicone Prompts package

client = OpenAI(
    api_key="YOUR_API_KEY",
    base_url="https://oai.helicone.ai/v1",
    default_headers={
        "Helicone-Auth": f"Bearer {HELICONE_API_KEY}",
    }
)

character = "a detective"
location = "Paris"

response = client.chat.completions.create(
    model="gpt-4",
    messages=[
        {
            "role": "user",
            "content": hpf(
                "Write a story about {character} set in {location}",
                character=character,
                location=location
            ),
        }
    ],
    extra_headers={
        "Helicone-Prompt-Id": "story_generator",  # Assign a unique ID to your prompt
    }
)
```

##### Manual Implementation (No Package)

```javascript
// Before
const response = await openai.chat.completions.create({
  model: "gpt-4",
  messages: [
    {
      role: "user",
      content: `Write a story about ${character} set in ${location}`,
    },
  ],
});

// After
const response = await openai.chat.completions.create(
  {
    model: "gpt-4",
    messages: [
      {
        role: "user",
        content: `Write a story about <helicone-prompt-input key="character">${character}</helicone-prompt-input> set in <helicone-prompt-input key="location">${location}</helicone-prompt-input>`,
      },
    ],
  },
  {
    headers: {
      "Helicone-Prompt-Id": "story_generator", // Assign a unique ID to your prompt
    },
  }
);
```

#### Implementation Context

When implementing Helicone Prompts, consider:

1. **Identify Variable Inputs**: Determine which parts of your prompts are variable and should be tracked.
2. **Create Meaningful Prompt IDs**: Use descriptive IDs that reflect the purpose of each prompt.
3. **Static vs. Dynamic Content**: Use `hpstatic` for unchanging parts of your prompts (like system instructions).
4. **Version Management**: Helicone automatically versions your prompts when they change.

#### Benefits

- Track prompt performance over time
- Maintain a dataset of inputs and outputs for each prompt
- Easily A/B test different prompt versions
- Collaborate on prompt development with your team
