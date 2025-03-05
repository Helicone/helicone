# Gemini with Helicone Example (TypeScript)

This example demonstrates how to use Google's Gemini models through Helicone gateway using a simple fetch API approach.

## Overview

This example shows:

1. How to configure a fetch request to use Gemini through Helicone
2. How to properly set Helicone headers including user_id and custom properties
3. How to structure the request for Gemini API

## Prerequisites

- Node.js 16+
- A Helicone API key
- A Google Gemini API key

## Setup

1. Clone the repository and navigate to this example directory:

```bash
cd examples/gemini-instructor-example/typescript
```

2. Create a `.env` file with your API keys:

```
HELICONE_API_KEY=your_helicone_api_key
GEMINI_API_KEY=your_gemini_api_key
USER_ID=test_user_123
```

3. Install dependencies:

```bash
npm install
```

4. Run the example:

```bash
npm start
```

## How It Works

### Making a Request to Gemini through Helicone

The key is setting up the request configuration properly:

```typescript
const requestConfig = {
  url: `https://gateway.helicone.ai/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`,
  headers: {
    "Content-Type": "application/json",
    "Helicone-Auth": `Bearer ${HELICONE_API_KEY}`,
    "Helicone-Target-Url": "https://generativelanguage.googleapis.com",
    "Helicone-User-Id": USER_ID,
    "Helicone-Property-App": "cursor-extension-cursorrules",
    "Helicone-Property-AnalyticsPermission": analyticsPermission
      ? "true"
      : "false",
  },
  body: {
    contents: [
      {
        role: "user",
        parts: [{ text: prompt }],
      },
    ],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 8192,
    },
  },
};

// Then make the API call with fetch
const response = await fetch(requestConfig.url, {
  method: "POST",
  headers: requestConfig.headers,
  body: JSON.stringify(requestConfig.body),
});
```

## Verifying in Helicone

After running the example, you can check your Helicone dashboard to verify that:

1. The request was logged correctly
2. User ID and properties are associated with the request

## Troubleshooting

If you encounter issues:

1. Ensure your API keys are correct
2. Check that your network can reach the Helicone gateway
3. Verify the request format matches Gemini's API requirements

## Additional Resources

- [Helicone Documentation](https://docs.helicone.ai)
- [Google Generative AI API Documentation](https://ai.google.dev/docs)
