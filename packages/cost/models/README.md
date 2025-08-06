# Model Registry

## Architecture

The model registry organizes LLM model definitions, pricing, and provider configurations.

### Core Concepts

- **Model**: A specific LLM (e.g., `claude-3.5-haiku`, `gpt-4`)
- **Author**: The company that created the model (e.g., `anthropic`, `openai`)
- **Provider**: Where you can run the model (e.g., `bedrock`, `vertex`, `anthropic`)
- **Endpoint**: A specific way to access a model on a provider (pricing, limits, region, etc.)
  - One model can have multiple endpoints per provider
  - Example: `gemini-1.5-pro` on Vertex AI might have:
    - Global endpoint
    - US-specific endpoint  
    - EU-specific endpoint
    - Each with different pricing or capabilities

### Structure

```
models/
├── index.ts           # Public API - all external access goes through here
├── types.ts           # TypeScript type definitions
├── providers.ts       # Provider configurations (Anthropic, Bedrock, Vertex, etc.)
├── model-versions.ts  # Maps base models to versioned variants
└── authors/           # One folder per model author
    ├── anthropic/
    │   ├── index.ts   # Combines models, endpoints, metadata
    │   ├── models.ts  # Model definitions
    │   ├── endpoints.ts # Provider endpoints with pricing
    │   └── metadata.json # Author metadata
    └── openai/...
```

## Adding New Models

### 1. Add to an existing author

Edit `authors/<author>/models.ts`:

```typescript
export type AnthropicModelName =
  | "claude-3.5-haiku"
  | "new-model-name";  // Add here

export const anthropicModels = {
  // ... existing models
  "new-model-name": {
    id: "new-model-name",
    name: "Anthropic: New Model",
    author: "anthropic",
    description: "Description here",
    contextLength: 200000,
    maxOutputTokens: 8192,
    created: "2024-10-22T00:00:00.000Z",
    modality: "text+image->text",
    tokenizer: "Claude",
  },
};
```

### 2. Add endpoints with pricing

Edit `authors/<author>/endpoints.ts`:

```typescript
export const anthropicEndpoints = {
  "new-model-name": [
    {
      provider: "anthropic",
      providerModelId: "new-model-api-name",
      pricing: {
        prompt: 3,
        completion: 15,
        cacheWrite: {
          "5m": 3.75,
          "1h": 6,
          default: 3.75
        },
      },
      contextLength: 200000,
      maxCompletionTokens: 8192,
    },
  ],
};
```

## Adding New Providers

Edit `providers.ts`:

```typescript
export const providers = {
  // ... existing providers
  "new-provider": {
    name: "New Provider",
    baseUrl: "https://api.newprovider.com",
    auth: "api-key",
    endpoints: {
      chat: "/v1/chat/completions",
    },
    buildModelId: (endpoint) => endpoint.providerModelId || "",
    buildUrl: (baseUrl) => `${baseUrl}/v1/chat/completions`,
  },
};
```

## Adding New Authors

1. Create folder: `authors/new-author/`
2. Add files:
   - `metadata.json` - Author info
   - `models.ts` - Model definitions
   - `endpoints.ts` - Provider endpoints
   - `index.ts` - Export everything

## Usage

All access through `index.ts`:

```typescript
import { getModel, getEndpoints, buildEndpointUrl } from './models';

// Get model info
const model = getModel("claude-3.5-haiku");

// Get all endpoints for a model
const endpoints = getEndpoints("claude-3.5-haiku");

// Build URL for an endpoint
const url = buildEndpointUrl(endpoints[0], {
  region: "us-east-1",
  crossRegion: true
});
```

## Type Safety

If a model doesn't have endpoints yet, comment it out in the type definition:

```typescript
export type OpenAIModelName =
  | "gpt-4"
  // | "gpt-5"  // TODO: Add endpoints
```

This ensures TypeScript validates that all active models have complete definitions.