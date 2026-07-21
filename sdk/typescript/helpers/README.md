# @helicone/helpers

A Node.js wrapper for some of Helicone's common SDK functionalities. This package provides a low-level manual logger for routing LLM traffic directly to Helicone without going through the proxy, plus prompt-management types and helpers.

Use `@helicone/helpers` when:

- You already call an LLM provider directly (or via your own client) and want to forward the request/response pair to Helicone.
- You stream responses and need to record `timeToFirstToken`, the full streamed body, and request/response latency.
- You want to log custom provider traffic (any HTTP-shaped LLM call) without rewriting your client.

For an opinionated OpenAI wrapper that batches async logs, see [`@helicone/async`](../async/README.md). For a drop-in proxy, see the [Helicone proxy docs](https://docs.helicone.ai).

## Features

- Manual logging to Helicone without the proxy
- Provider routing for `OPENAI`, `ANTHROPIC`, `GOOGLE`, `X` (xAI / Grok), and arbitrary custom endpoints
- Streaming support with `timeToFirstToken` and full response capture
- TypeScript types for `HeliconeLogRequest`, `HeliconePromptManager`, and chat completion params

## Installation

```bash
npm install @helicone/helpers
```

The package is published as `@helicone/helpers` on npm.

## Quick Start

1. Create a Helicone account and grab an API key from [helicone.ai/developer](https://helicone.ai/developer).
2. Set your Helicone API key as an environment variable:

```bash
export HELICONE_API_KEY=<your API key>
```

3. Wrap a provider call with the manual logger:

```typescript
import { HeliconeManualLogger } from "@helicone/helpers";

const helicone = new HeliconeManualLogger({
  apiKey: process.env.HELICONE_API_KEY!,
});

const request = {
  _type: "chat" as const,
  model: "gpt-4o-mini",
  messages: [{ role: "user", content: "Hello world" }],
};

const result = await helicone.logRequest(
  request,
  async (recorder) => {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });
    const json = await response.json();
    recorder.appendResults({ ...json });
    return json;
  },
  undefined,
  "OPENAI"
);
```

The log is forwarded to Helicone asynchronously. `logRequest` returns the value produced by your operation so it stays a drop-in wrapper around your existing call.

## Configuration

### `HeliconeManualLogger` options

```typescript
interface IHeliconeManualLogger {
  apiKey: string;                      // Required. Helicone API key.
  headers?: Record<string, string>;    // Optional. Headers merged into every log request.
  loggingEndpoint?: string;            // Optional. Override the default Helicone logging endpoint.
}
```

The default `loggingEndpoint` is `https://api.worker.helicone.ai/custom/v1/log`. When you pass a `provider` to `logRequest`, `logSingleRequest`, `logStream`, or `logSingleStream`, the SDK rewrites the trailing `/custom/v1/log` to the matching provider route (see below).

### Provider routing

The `provider` argument on each logging method selects a Helicone route:

| `provider` | Route              |
| ---------- | ------------------ |
| `OPENAI`   | `/oai/v1/log`      |
| `ANTHROPIC`| `/anthropic/v1/log`|
| `GOOGLE`   | `/googleapis/v1/log`|
| `X`        | `/x/v1/log`        |
| (omitted)  | `/custom/v1/log`   |

Any other value (or no value) routes to `/custom/v1/log`.

## Logging methods

All four methods share the same `HeliconeLogRequest` shape. The relevant parts:

```typescript
interface HeliconeLogRequest {
  _type: "chat" | "embedding" | "tool" | "custom";
  model?: string;
  messages?: Array<{ role: string; content: string }>;
  toolName?: string;
  name?: string;
  // ...plus any provider-specific fields
}
```

### `logRequest`: wrap a non-streaming call

```typescript
const response = await helicone.logRequest(
  request,
  async (recorder) => {
    const json = await callProvider(request);
    recorder.appendResults(json);
    return json;
  },
  { "Helicone-User-Id": userId },
  "OPENAI"
);
```

### `logSingleRequest`: log a completed request

If you already have the response body and latency:

```typescript
await helicone.logSingleRequest(
  request,
  JSON.stringify(responseBody),
  {
    additionalHeaders: { "Helicone-User-Id": userId },
    latencyMs: 1234,
  }
);
```

### `logStream`: wrap a streaming call

```typescript
const userStream = await helicone.logStream(
  request,
  async (recorder) => {
    const response = await provider.createChatCompletion({ stream: true, ...request });
    const [a, b] = response.tee();
    recorder.attachStream(b.toReadableStream());
    return a;
  },
  { "Helicone-User-Id": userId }
);
```

### `logSingleStream`: log an existing `ReadableStream`

```typescript
await helicone.logSingleStream(
  request,
  responseBodyStream,
  { "Helicone-User-Id": userId }
);
```

### `logBuilder`: manual control over streaming logs

`HeliconeLogBuilder` is exposed for advanced flows where you want to attach a stream after-the-fact or push additional headers mid-flight:

```typescript
const builder = helicone.logBuilder(request, {
  "Helicone-User-Id": userId,
});

const providerStream = provider.createChatCompletion({ stream: true, ...request });

// `toReadableStream` returns a stream for the client and buffers for logging.
const clientStream = builder.toReadableStream(providerStream);

// ...pipe `clientStream` to the HTTP response...

builder.addAdditionalHeaders({ "Helicone-Property-Feature": "summarizer" });
await builder.sendLog();
```

If the request fails, call `builder.setError(err)` before `sendLog()` so the recorded status is `500` and the stack is captured.

## Prompts helper

The package also re-exports `HeliconePromptManager` and the chat-completion types used by the prompts subsystem:

```typescript
import {
  HeliconePromptManager,
  HeliconePromptParams,
  HeliconeChatCreateParams,
  HeliconeChatCreateParamsStreaming,
} from "@helicone/helpers";
```

`HeliconePromptManager` is implemented in `packages/prompts/HeliconePromptManager.ts`. See that file for the full API.

## Custom headers

Pass any Helicone-supported header as an entry in `additionalHeaders`:

```typescript
await helicone.logSingleRequest(
  request,
  body,
  {
    additionalHeaders: {
      "Helicone-User-Id": "user-123",
      "Helicone-Property-Environment": "production",
      "Helicone-Cache-Enabled": "true",
    },
  }
);
```

See the [Helicone headers reference](https://docs.helicone.ai/features/advanced-usage/custom-properties) for the full list.

## Error handling

Logging is fire-and-forget. Errors talking to the Helicone logging endpoint are logged to `console.error` and never thrown, so a logging failure will not break your request flow. Application errors thrown from your operation, however, still propagate normally from `logRequest` and `logStream`.

If you need to capture an application error in the log itself, use `HeliconeLogBuilder.setError` before calling `sendLog`.

## Best practices

1. Always store API keys in environment variables.
2. Pass a `provider` argument when calling a known provider. It picks the correct logging route so the request shows up under the right provider in the dashboard.
3. Use `Helicone-User-Id` and `Helicone-Property-*` headers to make the logs searchable.
4. For high-volume backends, batch logs through `@helicone/async` instead of this package.

## Contributing

We welcome contributions. See the [Helicone contributing guidelines](https://github.com/Helicone/helicone/blob/main/CONTRIBUTING_GUIDELINES.md) for details.

## License

Apache-2.0

## Support

- Documentation: [https://docs.helicone.ai](https://docs.helicone.ai)
- Issues: [GitHub Issues](https://github.com/helicone/helicone/issues)
- Discord: [Join the community](https://discord.gg/zsSTcH2qhG)