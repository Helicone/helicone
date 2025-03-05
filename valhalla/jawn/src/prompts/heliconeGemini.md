#### Google Gemini Integration

##### JavaScript/TypeScript (Google Generative AI SDK)

```javascript
// Before
import { GoogleGenerativeAI } from "@google/generative-ai";
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// After
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize the client with Helicone integration
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

// Configure model parameters
const modelParams = {
  model: "gemini-2.0-flash",
  systemInstruction:
    "You are a helpful assistant that can answer questions and help with tasks.",
};

// Create model instance with Helicone integration
const modelInstance = genAI.getGenerativeModel(modelParams, {
  baseUrl: "https://gateway.helicone.ai",
  customHeaders: {
    "Helicone-Auth": `Bearer ${process.env.HELICONE_API_KEY}`,
    "Helicone-Target-URL": "https://generativelanguage.googleapis.com",
  },
});

// Generate content
async function generateContent() {
  const response = await modelInstance.generateContent("Hello, world!");
  console.log(response.text());
}
```

##### JavaScript/TypeScript (Fetch API)

```javascript
// Before
const response = await fetch(
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": process.env.GEMINI_API_KEY,
    },
    body: JSON.stringify({
      contents: [
        { parts: [{ text: "Write a story about a magic backpack." }] },
      ],
    }),
  }
);

// After
const url = `https://gateway.helicone.ai/v1beta/models/gemini-pro:generateContent?key=${process.env.GOOGLE_API_KEY}`;

const headers = {
  "Content-Type": "application/json",
  "Helicone-Auth": `Bearer ${process.env.HELICONE_API_KEY}`,
  "Helicone-Target-URL": "https://generativelanguage.googleapis.com",
};

const body = JSON.stringify({
  contents: [
    {
      parts: [
        {
          text: "Write a story about a magic backpack.",
        },
      ],
    },
  ],
});

const response = await fetch(url, {
  method: "POST",
  headers: headers,
  body: body,
});
```

##### Python (Google Generative AI SDK)

```python
# Before
import google.generativeai as genai
import os

genai.configure(
  api_key="GEMINI_API_KEY",
  client_options={
    "api_endpoint": "https://gemini.helicone.ai",
    "headers": {
      "Helicone-Auth": f"Bearer {os.getenv('HELICONE_API_KEY')}"
    }
  }
)

# After
from google import genai
import os

client = genai.Client(
    api_key=os.environ.get('GOOGLE_API_KEY'),
    http_options={
        "base_url": 'https://gateway.helicone.ai',
        "headers": {
            "helicone-auth": f'Bearer {os.environ.get("HELICONE_API_KEY")}',
            "helicone-target-url": 'https://generativelanguage.googleapis.com'
        }
    }
)

# Generate content
response = client.models.generate_content(
    model='gemini-2.0-flash',
    contents='Tell me a story in 300 words.'
)
print(response.text)
```

##### Python (Vertex AI)

```python
# Before
import vertexai
from vertexai.generative_models import GenerativeModel

vertexai.init(project="your-project-id", location="your-location")
model = GenerativeModel("gemini-1.5-flash-001")

# After
import vertexai
from vertexai.generative_models import GenerativeModel
import os

HELICONE_API_KEY = os.environ.get("HELICONE_API_KEY")
PROJECT_ID = os.environ.get("PROJECT_ID")
LOCATION = os.environ.get("LOCATION")

vertexai.init(
    project=PROJECT_ID,
    location=LOCATION,
    api_endpoint="gateway.helicone.ai",
    api_transport="rest",  # Must be 'rest' or else it will not work
    request_metadata=[
        ('helicone-target-url', f'https://{LOCATION}-aiplatform.googleapis.com'),
        ('helicone-auth', f'Bearer {HELICONE_API_KEY}')
    ]
)

model = GenerativeModel("gemini-1.5-flash-001")
response = model.generate_content("Tell me a fun fact about space.")
print(response.text)
```
