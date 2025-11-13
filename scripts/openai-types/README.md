# OpenAI Types Extractor

Extract just the types you need from OpenAI's massive API spec.

## Quick Start

```bash
# Install dependencies
npm install

# Generate the full OpenAI Zod schemas
npx openapi-zod-client https://app.stainless.com/api/spec/documented/openai/openapi.documented.yml -o openai.chat.zod.ts --export-schemas --export-types

# Extract types and their dependencies
node extract-openai-types.js
```

This creates:
- `chat-completion-types.ts` - `CreateChatCompletionRequest` schema and its dependencies
- `responses-types.ts` - `CreateResponse` schema and its dependencies

Much smaller and faster than working with the full 22k+ line file!

## Usage

```typescript
import { CreateChatCompletionRequest } from './chat-completion-types';
import { CreateResponse } from './responses-types';
import { z } from 'zod';

// Validate chat completion request data
const chatRequest = CreateChatCompletionRequest.parse({
  model: "gpt-4o",
  messages: [{ role: "user", content: "Hello!" }]
});

// Validate response request data
const responseRequest = CreateResponse.parse({
  model: "gpt-4o",
  input: "Hello, world!"
});

// Get TypeScript types
type ChatRequest = z.infer<typeof CreateChatCompletionRequest>;
type ResponseRequest = z.infer<typeof CreateResponse>;
```