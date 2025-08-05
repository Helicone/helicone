# Cost Package

The Cost package provides pricing calculations for LLM providers supported by Helicone. It contains cost models for various AI/ML service providers and calculates token-based pricing.

## Architecture

### Core Files

- **`index.ts`** - Main entry point with cost calculation functions
- **`interfaces/Cost.ts`** - TypeScript interfaces for model definitions
- **`providers/mappings.ts`** - Provider URL patterns and cost mappings
- **`costCalc.ts`** - Cost calculation utilities and constants

### Model Registry

The model registry provides a comprehensive database of AI models with their metadata, pricing, and endpoint information. Data is synced from OpenRouter API and organized by author.

#### Structure

```
models/
├── authors/          # Model data organized by author
│   ├── anthropic/
│   │   ├── models.json
│   │   ├── endpoints.json
│   │   └── metadata.json
│   └── openai/
│       ├── models.json
│       ├── endpoints.json
│       └── metadata.json
├── index.ts          # Auto-generated registry index
├── model-versions.json
└── scripts/
    ├── sync-openrouter.ts  # Sync data from OpenRouter
    └── build-registry.ts   # Build combined index
```

#### Scripts

```bash
# Sync latest model data from OpenRouter
yarn sync-openrouter

# Build registry index from author folders
yarn build-registry
```

### Provider Structure

Each provider has its own directory under `providers/` containing:

- `index.ts` - Main cost definitions for the provider
- Additional files for specific model categories (e.g., `chat/`, `completion/`)

## Model Registry API

```typescript
import {
  registry,
  getModel,
  getEndpoints,
  getAuthor,
} from "@helicone-package/cost/models";

// Get a specific model
const model = getModel("claude-3.5-sonnet");

// Get all endpoints for a model
const endpoints = getEndpoints("claude-3.5-sonnet");

// Get author information
const author = getAuthor("anthropic");

// Access all data
const { models, endpoints, authors, modelVersions } = registry;
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
