# Proxy Setup

### Installation and Setup

1. **To get started, install the `helicone-openai` package**:

   ```bash
   npm install @helicone/helicone
   ```

2. **Set HELICONE_API_KEY as an environment variable:**

   ```base
   Set HELICONE_API_KEY as an environment variable:
   ```

   ℹ️ You can also set the Helicone API Key in your code (See below).

3. **Replace:**

   ```typescript
   const { ClientOptions, OpenAI } = require("openai");
   ```

   **with:**

   ```typescript
   const { HeliconeProxyOpenAI as OpenAI,
       IHeliconeProxyClientOptions as ClientOptions } = require("helicone");
   ```

4. **Make a request**
   Chat, Completion, Embedding, etc usage is equivalent to OpenAI package.

   ```typescript
   const openai = new OpenAI({
     apiKey: process.env.OPENAI_API_KEY,
     heliconeMeta: {
       apiKey: process.env.HELICONE_API_KEY, // Can be set as env variable
       // ... additional helicone meta fields
     },
   });

   const chatCompletion = await openai.chat.completion.create({
     model: "gpt-3.5-turbo",
     messages: [{ role: "user", content: "Hello world" }],
   });

   console.log(chatCompletion.data.choices[0].message);
   ```

### Send Feedback

Ensure you store the helicone-id header returned in the original response.

```typescript
const { data, response } = await openai.chat.completion
  .create({
    model: "gpt-3.5-turbo",
    messages: [{ role: "user", content: "Hello world" }],
  })
  .withResponse();

const heliconeId = response.headers.get("helicone-id");

await openai.helicone.logFeedback(heliconeId, HeliconeFeedbackRating.Positive); // or Negative
```

### HeliconeMeta options

```typescript
interface IHeliconeMeta {
  apiKey?: string;
  properties?: { [key: string]: any };
  cache?: boolean;
  retry?: boolean | { [key: string]: any };
  rateLimitPolicy?: string | { [key: string]: any };
  user?: string;
  baseUrl?: string;
  onFeedback?: OnHeliconeFeedback; // Callback after feedback was processed
}

type OnHeliconeLog = (response: Response) => Promise<void>;
type OnHeliconeFeedback = (result: Response) => Promise<void>;
```

# Async Setup

### Installation and Setup

1. **To get started, install the `helicone-openai` package**:

   ```bash
   npm install @helicone/helicone
   ```

2. **Set HELICONE_API_KEY as an environment variable:**

   ```base
   Set HELICONE_API_KEY as an environment variable:
   ```

   ℹ️ You can also set the Helicone API Key in your code (See below).

3. **Replace:**

   ```typescript
   const { ClientOptions, OpenAI } = require("openai");
   ```

   **with:**

   ```typescript
   const { HeliconeAsyncOpenAI as OpenAI,
       IHeliconeAsyncClientOptions as ClientOptions } = require("helicone");
   ```

4. **Make a request**
   Chat, Completion, Embedding, etc usage is equivalent to OpenAI package.

   ```typescript
   const openai = new OpenAI({
     apiKey: process.env.OPENAI_API_KEY,
     heliconeMeta: {
       apiKey: process.env.HELICONE_API_KEY, // Can be set as env variable
       // ... additional helicone meta fields
     },
   });

   const chatCompletion = await openai.chat.completion.create({
     model: "gpt-3.5-turbo",
     messages: [{ role: "user", content: "Hello world" }],
   });

   console.log(chatCompletion.data.choices[0].message);
   ```

### Send Feedback

With Async logging, you must retrieve the `helicone-id` header from the log response (not LLM response).

```typescript
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  heliconeMeta: {
    apiKey: process.env.HELICONE_API_KEY,
    onLog: async (response: Response) => {
      const heliconeId = response.headers.get("helicone-id");
      await openai.helicone.logFeedback(
        heliconeId,
        HeliconeFeedbackRating.Positive
      );
    },
  },
});
```

### HeliconeMeta options

Async logging loses some additional features such as cache, rate limits, and retries

```typescript
interface IHeliconeMeta {
  apiKey?: string;
  properties?: { [key: string]: any };
  user?: string;
  baseUrl?: string;
  onLog?: OnHeliconeLog;
  onFeedback?: OnHeliconeFeedback;
}

type OnHeliconeLog = (response: Response) => Promise<void>;
type OnHeliconeFeedback = (result: Response) => Promise<void>;
```
