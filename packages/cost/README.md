# Cost Package

The Cost package provides pricing calculations and model registry for LLM providers supported by Helicone. It contains cost models for various AI/ML service providers and manages both Pass-Through Billing (PTB) and Bring Your Own Key (BYOK) scenarios.

## Architecture

### Core Files

- **`index.ts`** - Main entry point with cost calculation functions
- **`interfaces/Cost.ts`** - TypeScript interfaces for model definitions
- **`providers/mappings.ts`** - Provider URL patterns and cost mappings
- **`costCalc.ts`** - Cost calculation utilities and constants

## Model Registry v2

The model registry provides a comprehensive, type-safe database of AI models with their metadata, pricing, and endpoint configurations. It supports O(1) lookups for efficient access patterns.

### Core Concepts

- **ModelProviderConfig**: Base configuration for a model/provider combination with pricing, context limits, and parameters
- **EndpointConfig**: Deployment-specific overrides (e.g., regional deployments, different versions)
- **Endpoint**: Fully resolved configuration merging base + deployment configs
- **PTB (Pass-Through Billing)**: Helicone handles billing, requires `ptbEnabled: true`
- **BYOK (Bring Your Own Key)**: Users provide their own API keys, uses base configs

### Structure

```
models/
├── authors/              # Model data organized by author
│   ├── anthropic/
│   │   ├── claude-3.5-sonnet/
│   │   │   ├── models.ts
│   │   │   └── endpoints.ts
│   │   └── index.ts
│   ├── openai/
│   │   ├── gpt-4/
│   │   │   ├── models.ts
│   │   │   └── endpoints.ts
│   │   └── index.ts
│   └── [other-authors]/
├── registry.ts           # Main registry with API methods
├── build-indexes.ts      # Index builder for O(1) lookups
├── types.ts             # Core type definitions
└── providers.ts         # Provider configurations
```

## Request Processing Flows

For detailed explanations of how PTB (Pass-Through Billing) and BYOK (Bring Your Own Key) flows work, including the priority system and all implementation details, see [FLOWS.md](./FLOWS.md).

### Quick Summary

- **PTB**: Helicone manages API keys and handles billing
- **BYOK**: Users provide their own API keys and are billed directly
- **Priority**: BYOK always takes precedence over PTB when available
- **BYOK-Only Mode**: Users can disable PTB fallback for specific providers

## Key Design Principles

1. **O(1) Lookups**: All primary access patterns use Map-based indexes for constant time access
2. **Type Safety**: Full TypeScript types with intellisense support for model names, providers, and deployments
3. **Progressive Enhancement**: PTB endpoints inherit from base configs with deployment-specific overrides
4. **Cost Optimization**: PTB endpoints are automatically sorted by cost (cheapest first)
5. **Efficient DB Queries**: Returns Sets instead of arrays where appropriate for `IN` queries
6. **Clear Separation**: PTB (resolved endpoints) vs BYOK (base configs) have distinct APIs

## Data Structure

### ModelProviderConfig

```typescript
interface ModelProviderConfig {
  providerModelId: string;
  provider: ProviderName;
  pricing: ModelPricing;
  contextLength: number;
  maxCompletionTokens: number;
  ptbEnabled: boolean;
  supportedParameters: StandardParameter[];
  endpointConfigs: Record<string, EndpointConfig>;
  version?: string;
}
```

### EndpointConfig (Deployment Override)

```typescript
interface EndpointConfig {
  providerModelId?: string;
  pricing?: ModelPricing;
  contextLength?: number;
  maxCompletionTokens?: number;
  ptbEnabled?: boolean;
  version?: string;
}
```

### Endpoint (Resolved)

```typescript
interface Endpoint {
  provider: ProviderName;
  providerModelId: string;
  pricing: ModelPricing;
  contextLength: number;
  maxCompletionTokens: number;
  ptbEnabled: boolean;
  supportedParameters: StandardParameter[];
  endpointKey: string;
  deployment?: string;
  version?: string;
}
```

---

## Contributing New Pricing

### Adding a New Provider

1. **Create provider directory**: `providers/your-provider/`
2. **Create cost definitions**: `providers/your-provider/index.ts`
3. **Add to mappings**: Update `providers/mappings.ts`

Example provider structure:

```typescript
// providers/your-provider/index.ts
import { ModelRow } from "../../interfaces/Cost";

export const costs: ModelRow[] = [
  {
    model: {
      operator: "equals",
      value: "your-provider/model-name",
    },
    cost: {
      prompt_token: 0.000001,
      completion_token: 0.000002,
    },
  },
];
```

### Adding Models to Existing Providers

1. **Find the provider file**: Navigate to `providers/[provider-name]/`
2. **Add model entry**: Add new `ModelRow` objects to the `costs` array
3. **Use correct pricing**: Convert per-million-token pricing to per-token

Example model addition:

```typescript
{
  model: {
    operator: "equals",
    value: "meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8",
  },
  cost: {
    prompt_token: 0.00027,     // $0.27 per 1M tokens
    completion_token: 0.00085, // $0.85 per 1M tokens
  },
},
```

### Model Matching Operators

- **`equals`** - Exact string match (case-insensitive)
- **`startsWith`** - Model name starts with value
- **`includes`** - Model name contains value

### Cost Structure

The `cost` object supports:

- `prompt_token` - Cost per input token (required)
- `completion_token` - Cost per output token (required)
- `per_image` - Cost per image (optional)
- `per_call` - Cost per API call (optional)
- `prompt_cache_write_token` - Cost per cached prompt write token
- `prompt_cache_read_token` - Cost per cached prompt read token
- `prompt_audio_token` - Cost per audio input token
- `completion_audio_token` - Cost per audio output token

### Pricing Conversion

TogetherAI pricing example:

- Website: "$0.27 per 1M input tokens"
- Code: `prompt_token: 0.00027`

Formula: `website_price_per_million / 1_000_000`

## Provider Integration

### Adding URL Pattern

In `providers/mappings.ts`:

1. **Add pattern**: Create regex for provider URLs

```typescript
const yourProvider = /^https:\/\/api\.yourprovider\.com/;
```

2. **Add to providers array**:

```typescript
{
  pattern: yourProvider,
  provider: "YOUR_PROVIDER",
  costs: yourProviderCosts,
},
```

3. **Add provider name**:

```typescript
export const providersNames = [
  // ... existing providers
  "YOUR_PROVIDER",
] as const;
```

### Import Costs

Import your cost definitions:

```typescript
import { costs as yourProviderCosts } from "./your-provider";
```

## Examples

### Recent TogetherAI Update

Recent update adding Llama 4 and DeepSeek models:

```typescript
// Added to providers/togetherai/chat/index.ts
{
  model: {
    operator: "equals",
    value: "meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8",
  },
  cost: {
    prompt_token: 0.00027,  // $0.27/1M tokens
    completion_token: 0.00085, // $0.85/1M tokens
  },
},
{
  model: {
    operator: "equals",
    value: "deepseek-ai/DeepSeek-V3",
  },
  cost: {
    prompt_token: 0.00125,  // $1.25/1M tokens
    completion_token: 0.00125,
  },
},
```

### Complex Cost Structure

Example with multiple cost types:

```typescript
{
  model: {
    operator: "equals",
    value: "gpt-4-vision-preview",
  },
  cost: {
    prompt_token: 0.00001,
    completion_token: 0.00003,
    per_image: 0.00765,     // Cost per image
  },
},
```

## Testing

After adding costs:

1. Test cost calculation with sample data
2. Verify provider pattern matching
3. Check model name matching (case sensitivity)

## Cost Calculation

The package provides two main functions:

- **`costOf({model, provider})`** - Get cost structure for a model
- **`costOfPrompt({...})`** - Calculate total cost for a request

Usage:

```typescript
import { costOf, costOfPrompt } from "@helicone/cost";

// Get cost structure
const cost = costOf({
  model: "gpt-4",
  provider: "https://api.openai.com",
});

// Calculate prompt cost
const totalCost = costOfPrompt({
  provider: "https://api.openai.com",
  model: "gpt-4",
  promptTokens: 100,
  completionTokens: 50,
  // ... other parameters
});
```

## File Header

All provider files include this header:

```typescript
/**
 *
 * DO NOT EDIT THIS FILE UNLESS IT IS IN /costs
 */
```

This indicates the files are generated/managed elsewhere and shouldn't be manually edited in this location.
