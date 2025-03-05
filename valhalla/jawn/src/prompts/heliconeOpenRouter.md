#### OpenRouter Integration

##### JavaScript/TypeScript (Fetch API)

```javascript
// Before
fetch("https://openrouter.ai/api/v1/chat/completions", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
    "HTTP-Referer": `${process.env.YOUR_SITE_URL}`, // Optional, for including your app on openrouter.ai rankings
    "X-Title": `${process.env.YOUR_SITE_NAME}`, // Optional. Shows in rankings on openrouter.ai
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    model: "openai/gpt-3.5-turbo", // Optional (user controls the default)
    messages: [{ role: "user", content: "What is the meaning of life?" }],
    stream: false,
  }),
});

// After
fetch("https://openrouter.helicone.ai/api/v1/chat/completions", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
    "Helicone-Auth": `Bearer ${process.env.HELICONE_API_KEY}`,
    "HTTP-Referer": `${process.env.YOUR_SITE_URL}`, // Optional, for including your app on openrouter.ai rankings
    "X-Title": `${process.env.YOUR_SITE_NAME}`, // Optional. Shows in rankings on openrouter.ai
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    model: "openai/gpt-3.5-turbo", // Optional (user controls the default)
    messages: [{ role: "user", content: "What is the meaning of life?" }],
    stream: false,
  }),
});
```

##### JavaScript/TypeScript (Streaming)

```javascript
// Before
fetch("https://openrouter.ai/api/v1/chat/completions", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    model: "openai/gpt-3.5-turbo",
    messages: [{ role: "user", content: "What is the meaning of life?" }],
    stream: true,
  }),
});

// After
fetch("https://openrouter.helicone.ai/api/v1/chat/completions", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
    "Helicone-Auth": `Bearer ${process.env.HELICONE_API_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    model: "openai/gpt-3.5-turbo",
    messages: [{ role: "user", content: "What is the meaning of life?" }],
    stream: true,
  }),
});
```

##### Node.js (Axios)

```javascript
// Before
import axios from "axios";

const response = await axios.post(
  "https://openrouter.ai/api/v1/chat/completions",
  {
    model: "anthropic/claude-3-opus",
    messages: [{ role: "user", content: "What is the meaning of life?" }],
  },
  {
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
    },
  }
);

// After
import axios from "axios";

const response = await axios.post(
  "https://openrouter.helicone.ai/api/v1/chat/completions",
  {
    model: "anthropic/claude-3-opus",
    messages: [{ role: "user", content: "What is the meaning of life?" }],
  },
  {
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Helicone-Auth": `Bearer ${process.env.HELICONE_API_KEY}`,
      "Content-Type": "application/json",
    },
  }
);
```

##### Python (Requests)

```python
# Before
import requests
import os

response = requests.post(
    "https://openrouter.ai/api/v1/chat/completions",
    headers={
        "Authorization": f"Bearer {os.environ.get('OPENROUTER_API_KEY')}",
        "Content-Type": "application/json",
    },
    json={
        "model": "openai/gpt-4",
        "messages": [{"role": "user", "content": "What is the meaning of life?"}],
    },
)

# After
import requests
import os

response = requests.post(
    "https://openrouter.helicone.ai/api/v1/chat/completions",
    headers={
        "Authorization": f"Bearer {os.environ.get('OPENROUTER_API_KEY')}",
        "Helicone-Auth": f"Bearer {os.environ.get('HELICONE_API_KEY')}",
        "Content-Type": "application/json",
    },
    json={
        "model": "openai/gpt-4",
        "messages": [{"role": "user", "content": "What is the meaning of life?"}],
    },
)
```
