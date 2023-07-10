# Helicone OpenAI Node.js Library

This package is a simple and convenient way to log all requests made through the OpenAI API with Helicone. You can easily track and manage your OpenAI API usage and monitor your GPT models' cost, latency, and performance on the Helicone platform.

## Installation

To install the Helicone OpenAI Node.js library, simply run the following command:

```bash
npm install helicone
```

## Usage

Firstly, you need to retrieve your Helicone API Key then select a logging type.

### Proxy Logging

Use this implementation if you want to proxy your OpenAI calls with Helicone. This means Helicone is in between
all of your calls to OpenAI which can add unwanted latency. Proxy logging supports all of the advanced features explained later.

```javascript
const { HeliconeProxyConfiguration, HeliconeProxyOpenAIApi } = require("helicone");

const heliconeProxyConfiguration = new HeliconeProxyConfiguration({
  heliconeMeta: {
    apiKey: heliconeKey,
  },
  apiKey: openAIKey,
});

const heliconeProxyOpenAIApi = new HeliconeProxyOpenAIApi(heliconeProxyConfiguration);

const completion = await heliconeProxyOpenAIApi.createCompletion({
  model: "text-davinci-003",
  prompt: "Hello world",
});
```

### Async Logging

Use this implementation if you want Helicone to log after your OpenAI response has been received. There will be no added latency in receiving back your OpenAI responses using this implementation. Logging will not be awaited, therefore you should expect an OpenAI response as soon as it is retrieved (the same goes from streaming). Async logging doesn't supports all of the advanced features explained later.

Async logging supports the following OpenAI requests:

- createChatCompletion
- createCompletion
- createEdit
- createEmbedding
- createImage
- createModeration

```javascript
const { HeliconeAsyncConfiguration, HeliconeAsyncOpenAIApi } = require("helicone");

const heliconeAsyncConfiguration = new HeliconeAsyncConfiguration(
  {
    heliconeMeta: {
      apiKey: heliconeKey,
    },
    apiKey: openAIKey,
  },
  // Optional on helicone log callback
  async (result: AxiosResponse<any, any>) => {}
);

const heliconeAsyncOpenAIApi = new HeliconeAsyncOpenAIApi(heliconeAsyncConfiguration);

const completion = await heliconeAsyncOpenAIApi.createCompletion({
  model: "text-davinci-003",
  prompt: "Hello world",
});
```

### Async Logging - Manual

Use this implementation if you want complete control over your logs. This will allow you to define the
Helicone log object while using OpenAI directly.

```javascript
const { HeliconeOpenAIApi, HeliconeAsyncConfiguration, Provider, HeliconeAsyncLogger } = require("helicone");

const heliconeAsyncConfiguration = new HeliconeAsyncConfiguration({
  heliconeMeta: {
    apiKey: heliconeKey,
  },
  apiKey: openAIKey,
});

const openAIApi = new HeliconeOpenAIApi(heliconeAsyncConfiguration);
const chatCompletionRequest = {
  model: "text-davinci-003",
  prompt: "Hello world",
};

// Time your OpenAI requests to retrieve latency metrics
const startTime = Date.now();
const completion = await openAIApi.createCompletion(chatCompletionRequest);
const endTime = Date.now();

// Create and map to the HeliconeAsyncLogRequests
const asyncLogModel = {
  providerRequest: {
    url: "https://api.openai.com/v1",
    json: chatCompletionRequest,
    meta: heliconeAsyncConfiguration.getHeliconeHeaders(),
  },
  providerResponse: {
    json: result.data,
    status: result.status,
    headers: result.headers,
  },
  timing: HeliconeAsyncLogger.createTiming(startTime, endTime),
};

const heliconeAsyncLogger = new HeliconeAsyncLogger(heliconeAsyncConfiguration);
await heliconeAsyncLogger.log(asyncLogModel, Provider.OPENAI);
```

## Advanced Features

Helicone offers caching, retries, custom properties, and rate limits for your APIs.

```javascript
const heliconeConfiguration = new HeliconeProxyConfiguration({
  heliconeMeta: {
    apiKey: heliconeApiKey,
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
    },
    user: "TestUser",
  },
  apiKey: openAIKey,
});
```

> Async logging does not support the following advanced features: Rate limiting, Caching, Retries

For more information see our [documentation](https://docs.helicone.ai/advanced-usage/custom-properties).

## Running Locally

If you are running Helicone locally, ensure you override the baseUrl in the heliconeMeta.

```javascript
const heliconeConfiguration = new HeliconeProxyConfiguration({
  heliconeMeta: {
    apiKey: heliconeApiKey,
    baseUrl: localHeliconeUrl,
  },
  apiKey: openAIKey,
});
```

## Streaming

To enable it, set stream to true and set the responseType to "stream". This is supported in both proxy and async logging.

```javascript
await openAIClient.createCompletion(
  {
    model: "text-davinci-003",
    prompt: "Hello world",
    stream: true,
  },
  { responseType: "stream" }
);
```

## Requirements

- Node.js version 12 or higher is required.
