# @helicone/async

A Node.js wrapper for logging LLM traces directly to Helicone, bypassing the proxy, with OpenLLMetry. This package enables you to monitor and analyze your OpenAI API usage without requiring a proxy server.

## Features

- Direct logging to Helicone without proxy
- OpenLLMetry support for standardized LLM telemetry
- Custom property tracking
- Environment variable configuration
- TypeScript support

## Installation

### Stable Version

```bash
npm install @helicone/async
```

## Quick Start

1. Create a Helicone account and get your API key from [helicone.ai/developer](https://helicone.ai/developer)

2. Set up your environment variables:

```bash
export HELICONE_API_KEY=<your API key>
export OPENAI_API_KEY=<your OpenAI API key>
```

3. Basic usage:

```typescript
const { HeliconeAsyncOpenAI } = require("helicone");

const openai = new HeliconeAsyncOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  heliconeMeta: {
    apiKey: process.env.HELICONE_API_KEY,
  },
});

const chatCompletion = await openai.chat.completion.create({
  model: "gpt-3.5-turbo",
  messages: [{ role: "user", content: "Hello world" }],
});

console.log(chatCompletion.data.choices[0].message);
```

## Configuration Options

### HeliconeMeta Options

The `heliconeMeta` object supports several configuration options:

```typescript
interface HeliconeMeta {
  apiKey?: string; // Your Helicone API key
  custom_properties?: Record<string, any>; // Custom properties to track
  cache?: boolean; // Enable/disable caching
  retry?: boolean; // Enable/disable retries
  user_id?: string; // Track requests by user
}
```

### Example with Custom Properties

```typescript
const openai = new HeliconeAsyncOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  heliconeMeta: {
    apiKey: process.env.HELICONE_API_KEY,
    custom_properties: {
      project: "my-project",
      environment: "production",
    },
    user_id: "user-123",
  },
});
```

## Advanced Usage

### With Async/Await

```typescript
async function generateResponse() {
  try {
    const response = await openai.chat.completion.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: "What is the capital of France?" },
      ],
      max_tokens: 150,
    });

    return response.data.choices[0].message;
  } catch (error) {
    console.error("Error:", error);
  }
}
```

### Error Handling

```typescript
try {
  const completion = await openai.chat.completion.create({
    model: "gpt-3.5-turbo",
    messages: [{ role: "user", content: "Hello" }],
  });
} catch (error) {
  if (error.response) {
    console.error(error.response.status);
    console.error(error.response.data);
  } else {
    console.error(error.message);
  }
}
```

## Best Practices

1. Always store API keys in environment variables
2. Implement proper error handling
3. Use custom properties to track important metadata
4. Set appropriate timeout values for your use case
5. Consider implementing retry logic for production environments

## Contributing

We welcome contributions! Please see our [contributing guidelines](CONTRIBUTING.md) for details.

## License

[Add your license information here]

## Support

- Documentation: [https://docs.helicone.ai](https://docs.helicone.ai)
- Issues: [GitHub Issues](https://github.com/helicone/helicone/issues)
- Discord: [Join our community](https://discord.gg/zsSTcH2qhG)
