#### Vercel AI SDK Integration

##### OpenAI with Vercel AI SDK

```javascript
// Before
import { createOpenAI } from "@ai-sdk/openai";

const openai = createOpenAI({
  // Default configuration
});

// After
import { createOpenAI } from "@ai-sdk/openai";

const openai = createOpenAI({
  baseURL: "https://oai.helicone.ai/v1",
  headers: {
    "Helicone-Auth": `Bearer ${process.env.HELICONE_API_KEY}`,
  },
});

// Use openai to make API calls
const response = streamText({
  model: openai("gpt-4o"),
  prompt: "Hello world",
});
```

##### Anthropic with Vercel AI SDK

```javascript
// Before
import { createAnthropic } from "@ai-sdk/anthropic";

const anthropic = createAnthropic({
  // Default configuration
});

// After
import { createAnthropic } from "@ai-sdk/anthropic";

const anthropic = createAnthropic({
  baseURL: "https://anthropic.helicone.ai/v1",
  headers: {
    "Helicone-Auth": `Bearer ${process.env.HELICONE_API_KEY}`,
  },
});

// Use anthropic to make API calls
const response = streamText({
  model: anthropic("claude-3-5-sonnet-20241022"),
  prompt: "Hello world",
});
```

##### Google (Gemini) with Vercel AI SDK

```javascript
// Before
import { createGoogleGenerativeAI } from "@ai-sdk/google";

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_API_KEY,
  // Default configuration
});

// After
import { createGoogleGenerativeAI } from "@ai-sdk/google";

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_API_KEY,
  baseURL: "https://gateway.helicone.ai/v1beta",
  headers: {
    "Helicone-Auth": `Bearer ${process.env.HELICONE_API_KEY}`,
    "Helicone-Target-URL": "https://generativelanguage.googleapis.com",
  },
});

// Use Google AI to make API calls
const response = streamText({
  model: google("gemini-1.5-pro-latest"),
  prompt: "Hello world",
});
```

##### AWS Bedrock with Vercel AI SDK

```javascript
// Before
import { createAmazonBedrock } from "@ai-sdk/amazon-bedrock";

const bedrock = createAmazonBedrock({
  region: "us-east-1",
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  sessionToken: process.env.AWS_SESSION_TOKEN, // Optional: for temporary credentials
});

// After
import { createAmazonBedrock } from "@ai-sdk/amazon-bedrock";

const bedrock = createAmazonBedrock({
  region: "us-east-1",
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  sessionToken: process.env.AWS_SESSION_TOKEN, // Optional: for temporary credentials
  headers: {
    "Helicone-Auth": `Bearer ${process.env.HELICONE_API_KEY}`,
    "aws-access-key": process.env.AWS_ACCESS_KEY_ID,
    "aws-secret-key": process.env.AWS_SECRET_ACCESS_KEY,
    "aws-session-token": process.env.AWS_SESSION_TOKEN,
  },
});

// Use AWS Bedrock to make API calls
const response = streamText({
  model: bedrock("anthropic.claude-v2"),
  prompt: "Hello world",
});
```
