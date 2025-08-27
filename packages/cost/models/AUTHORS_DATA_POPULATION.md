# Model Database Population Guide

## Quick Start
Populate model data for AI providers in `/packages/cost/models/authors/`. Each author needs 4 files: models, endpoints, metadata, and index.

## Core Process

### 1. Research (Two Different Places!)
**Model IDs**: API docs → find exact `model_id` used in API calls  
**Pricing**: Separate pricing page → match to model IDs  
⚠️ Marketing names ≠ API IDs (e.g., "GPT-4 Turbo" ≠ "gpt-4-turbo-preview")

### 2. Create Author Files

#### models.ts
```typescript
export const authorModelNames = ["model-id-1", "model-id-2"] as const;
export type AuthorModelName = (typeof authorModelNames)[number];

export const authorModels = {
  "model-id": {
    name: "Provider: Model Name",        // Human readable
    author: "author-slug",                // Must match directory name
    description: "...",                   
    contextLength: 128000,                // Max input tokens
    maxOutputTokens: 4096,                
    created: "2024-01-01T00:00:00.000Z", // ISO date
    modality: { inputs: ["text"], outputs: ["text"] }, // or { inputs: ["text", "image"], outputs: ["text"] }
    tokenizer: "GPT",                     // or "Claude", "Gemini"
  }
} satisfies Record<AuthorModelName, Model>;
```

#### endpoints.ts
```typescript
export type AuthorEndpointId = 
  | `${AuthorModelName}:provider`
  | `${AuthorModelName}:provider:region`;

export const authorEndpoints = {
  "model-id:openai": {
    modelId: "model-id",
    provider: "openai",              // lowercase!
    providerModelId: "gpt-4",        // Actual API model ID
    pricing: {
      prompt: 30,                    // USD per MILLION tokens
      completion: 60,                // USD per MILLION tokens
      image: 0.01,                   // Optional
      cacheRead: null,               // null if not supported
    },
    contextLength: 128000,
    maxCompletionTokens: 4096,
    supportedParameters: ["temperature", "max_tokens"],
    ptbEnabled: true,
  },
  // Regional variants get separate entries
  "model-id:bedrock:us-west-2": { ... }
} satisfies Record<AuthorEndpointId, Endpoint>;
```

#### metadata.ts
```typescript
export const authorMetadata = {
  modelCount: 5,          // Must match actual count
  supported: true,
} satisfies AuthorMetadata;
```

#### index.ts
```typescript
export { authorMetadata } from "./metadata";
export { authorModels, type AuthorModelName } from "./models";
export { authorEndpoints, type AuthorEndpointId } from "./endpoints";
```

### 3. Register New Provider

If adding a **new provider** (not just new models):

1. Add to `/packages/cost/models/types.ts`:
```typescript
export const PROVIDERS = [
  // ... existing
  "new-provider",  // Add here
] as const;
```

2. Import in `/packages/cost/models/registry.ts`:
```typescript
import { newProviderModels, newProviderEndpoints } from "./authors/new-provider";

const allEndpoints = {
  // ... existing
  ...newProviderEndpoints,  // Add here
};

const allModels = {
  // ... existing
  ...newProviderModels,     // Add here
};
```

3. Add types to `/packages/cost/models/types.ts`:
```typescript
import { NewProviderModelName, type NewProviderEndpointId } from "./authors/new-provider";

export type ModelName = 
  | AnthropicModelName
  | NewProviderModelName  // Add here
  // ...

export type EndpointId =
  | AnthropicEndpointId
  | NewProviderEndpointId  // Add here
  // ...
```

## Critical Rules

### Pricing Conversion
- **Always USD per MILLION tokens**
- OpenAI shows per 1K: $0.01/1K = $10/million
- Some show per token: $0.00001/token = $10/million

### Model IDs
- Use exact API model ID, not marketing name
- Check actual API calls for the right string
- Deprecated models: exclude them

### Providers
- Always lowercase: `openai` not `OpenAI`
- Common: openai, anthropic, bedrock, azure, vertex, groq, together
- Regional: create separate endpoint entries

### Missing Data
- Use `null` not `0` or empty string
- Optional fields can be omitted

## Where to Find Data

### Model IDs & Specs
- API docs: platform.openai.com/docs/models
- SDK docs: Check Python/JS libraries
- API playground: Shows actual model IDs

### Pricing (Different Pages!)
- OpenAI: openai.com/api/pricing/
- Anthropic: anthropic.com/api#pricing
- AWS Bedrock: aws.amazon.com/bedrock/pricing/
- Google: cloud.google.com/vertex-ai/pricing

### Cross-Check
- OpenRouter API: openrouter.ai/api/v1/models
- Artificial Analysis: artificialanalysis.ai

## Priority Providers
1. OpenAI (gpt-4, gpt-3.5 series)
2. Anthropic (claude-3 series)  
3. Google (gemini series)
4. Meta (llama series)
5. Mistral (mistral, mixtral)

## Validation
```bash
# After adding models
cd packages/cost/models
tsc --noEmit  # Should compile without errors
```

Check:
- [ ] Model count matches metadata
- [ ] Pricing is per million tokens
- [ ] Provider names are lowercase
- [ ] No duplicate IDs
- [ ] Registry imports new providers