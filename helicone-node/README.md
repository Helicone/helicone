# Helicone OpenAI Node.js Library

This package is a simple and convenient way to log all requests made through the OpenAI API with Helicone. You can easily track and manage your OpenAI API usage and monitor your GPT models' cost, latency, and performance on the Helicone platform.

## Installation

To install the Helicone OpenAI Node.js library, simply run the following command:

```bash
npm install helicone-openai
```

## Usage
You need to have an API key from Helicone. Once you have the API key, set it as an environment variable HELICONE_API_KEY.

```bash
export HELICONE_API_KEY=your_helicone_api_key_here
```

Then, in your JavaScript or TypeScript code, replace your existing OpenAI library imports with Helicone's wrapper:

```javascript
const { Configuration, OpenAIApi } = require("helicone-openai"); // replace `require("openai")` with this line
```

The usage is now exactly same as the OpenAI SDK, except that you add the `heliconeApiKey` in the `Configuration` object and other optional advanced features as well.

```javascript
const { Configuration, OpenAIApi } = require("helicone-openai");

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
  heliconeApiKey: process.env.HELICONE_API_KEY,
});
const openai = new OpenAIApi(configuration);

const completion = await openai.createCompletion({
  model: "text-davinci-003",
  prompt: "Hello world",
});
console.log(completion.data.choices[0].text);
```

## Advanced Features
Helicone offers caching, retries, custom properties, and rate limits for your APIs. For all of the advanced features, instantiate them through the configuration:

```javascript
const configuration = new Configuration({
  apiKey,
  heliconeApiKey,
  cache: true,
  retry: true,
  properties: {
    Session: "24",
    Conversation: "support_issue_2",
  },
  rateLimitPolicy: { 
    quota: 10, 
    time_window: 60,
    segment: "Session",
  }
});
```

For more information see our [documentation](https://docs.helicone.ai/advanced-usage/custom-properties).

## Requirements
- Node.js version 12 or higher is required.
