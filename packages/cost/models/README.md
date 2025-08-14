# Helicone Cost Models Documentation

## Overview

The cost models package provides a comprehensive registry of LLM models, their pricing, and endpoint configurations across multiple providers. This system enables Helicone to track costs, manage pass-through billing (PTB), and provide accurate pricing information for various LLM deployments.

## Architecture

### Core Components

1. **Model Registry** (`registry.ts`)
   - Central singleton that manages all models and endpoints
   - Provides O(1) lookup for endpoints by model, provider, and region
   - Handles URL building and model ID construction for different providers

2. **Type System** (`types.ts`)
   - Defines core interfaces: `Model`, `Endpoint`, `ModelPricing`, `ProviderConfig`
   - Union types for all model names and endpoint IDs
   - Standardized parameters and modalities

3. **Provider Configurations** (`providers.ts`)
   - Configuration for each LLM provider (OpenAI, Anthropic, Bedrock, Vertex, etc.)
   - URL building logic for different deployment types
   - Authentication methods and required configuration

4. **Endpoint Selector** (`endpoint-selector.ts`)
   - Filters and selects endpoints based on criteria
   - Returns endpoints sorted by cost (cheapest first)

## Directory Structure

```
models/
├── authors/           # Model definitions organized by company
│   ├── anthropic/     # Anthropic models (Claude family)
│   │   ├── claude-3.5-sonnet-v2/
│   │   │   ├── model.ts      # Model metadata
│   │   │   └── endpoints.ts  # Provider endpoints & pricing
│   │   ├── claude-opus-4/
│   │   └── index.ts   # Aggregates all Anthropic models
│   ├── openai/        # OpenAI models (GPT family)
│   │   ├── gpt-4/
│   │   ├── gpt-4o/
│   │   └── o3/
│   ├── google/        # Google models (Gemini family)
│   ├── meta-llama/    # Meta's Llama models
│   └── [other providers...]
├── registry.ts        # Main registry with lookup methods
├── types.ts          # TypeScript type definitions
├── providers.ts      # Provider configurations
└── endpoint-selector.ts  # Endpoint filtering logic
```

## Key Concepts

### Models
A model represents a specific LLM with its capabilities:
- **name**: Display name
- **author**: Company that created the model
- **contextLength**: Maximum input tokens
- **maxOutputTokens**: Maximum generation tokens
- **modality**: Input/output types (text, image, multimodal)
- **tokenizer**: Tokenization method (GPT, Claude, Llama, etc.)

### Endpoints
An endpoint represents a specific deployment of a model on a provider:
- **modelId**: Reference to the model
- **provider**: Service hosting the model (OpenAI, Bedrock, Vertex, etc.)
- **region**: Geographic location (for cloud providers)
- **pricing**: Cost per 1M tokens for prompt/completion/cache
- **ptbEnabled**: Whether pass-through billing is available
- **supportedParameters**: Available configuration options

### Pricing Structure
Pricing is defined per million tokens:
```typescript
{
  prompt: 3,        // $3 per 1M input tokens
  completion: 15,   // $15 per 1M output tokens
  cacheRead: 0.3,   // Cache read cost
  cacheWrite: {     // Cache write can be tiered
    "5m": 3.75,     // 5-minute cache
    "1h": 6,        // 1-hour cache
    default: 3.75
  },
  thinking: 25      // Reasoning tokens (for o1-style models)
}
```

### Image Pricing

OpenAI and other multimodal models convert images to tokens rather than charging separately. The token count depends on image size and detail level:

#### Token Calculation by Model

| Model | Base Tokens (Low Detail) | Tokens per 512×512 Tile (High Detail) |
|-------|-------------------------|---------------------------------------|
| GPT-5, GPT-5-chat | 70 | 140 |
| GPT-4o, GPT-4.1, GPT-4.5 | 85 | 170 |
| GPT-4o-mini | 2,833 | 5,667 |
| o1, o1-pro, o3 | 75 | 150 |

#### High Detail Mode Calculation
1. Image is scaled to fit within 2048×2048 pixels (maintaining aspect ratio)
2. Shortest side is scaled to 768px
3. Image is divided into 512×512 pixel tiles
4. Total tokens = base tokens + (number of tiles × tile tokens)

#### Examples (GPT-4o)
- **Low detail** (any size): 85 tokens flat
- **1024×1024 high detail**: 4 tiles = 85 + (4 × 170) = 765 tokens
- **2048×1024 high detail**: 8 tiles = 85 + (8 × 170) = 1,445 tokens

#### Cost Estimation
For convenience, providers like OpenRouter display image costs as "per 1000 images" using an assumed average of 1,445 tokens per image (equivalent to an 8-tile high-detail image). Actual costs depend on image size and detail settings:

```
Example: GPT-4o at $2.50/M input tokens
- Low detail: 85 tokens = $0.21 per 1000 images
- Average (8 tiles): 1,445 tokens = $3.61 per 1000 images
- Large (12 tiles): 2,125 tokens = $5.31 per 1000 images
```

## Usage Examples

### Get a specific model
```typescript
const model = registry.getModel("claude-3.5-sonnet-v2");
```

### Find cheapest endpoint for a model
```typescript
const endpoints = registry.getModelEndpoints("gpt-4o");
// Returns endpoints sorted by cost, cheapest first
```

### Get PTB-enabled endpoints
```typescript
const ptbEndpoints = registry.getPtbEndpoints("claude-3.5-sonnet-v2");
```

### Filter endpoints by provider
```typescript
const endpoints = selectEndpoints("gpt-4", {
  providers: ["openai", "azure-openai"],
  ptbOnly: true
});
```

### Build provider URL
```typescript
const endpoint = registry.getEndpoint("claude-3.5-sonnet-v2", "bedrock", "us-west-2");
const url = registry.buildUrl(endpoint.data, {
  region: "us-west-2"
});
```

## Adding New Models

### 1. Create model definition
Create a new directory under the appropriate author:
```typescript
// authors/openai/gpt-5/model.ts
export const models = {
  "gpt-5": {
    name: "OpenAI: GPT-5",
    author: "openai",
    description: "Next generation model",
    contextLength: 128000,
    maxOutputTokens: 16384,
    created: "2025-01-01T00:00:00.000Z",
    modality: "text+image->text",
    tokenizer: "GPT",
  }
} satisfies Record<string, Model>;
```

### 2. Define endpoints
```typescript
// authors/openai/gpt-5/endpoints.ts
export const endpoints = {
  "gpt-5:openai": {
    modelId: "gpt-5",
    provider: "openai",
    providerModelId: "gpt-5",
    pricing: {
      prompt: 150,
      completion: 600,
    },
    contextLength: 128000,
    maxCompletionTokens: 16384,
    supportedParameters: ["tools", "temperature", "max_tokens"],
    ptbEnabled: true,
  }
} satisfies Record<string, Endpoint>;
```

### 3. Update author index
Add imports to the author's index.ts file to include the new model in the registry.

## Provider Support

### Currently Supported Providers
- **anthropic**: Direct Anthropic API
- **openai**: OpenAI API
- **bedrock**: AWS Bedrock (multi-region)
- **vertex**: Google Cloud Vertex AI
- **azure-openai**: Azure OpenAI Service
- **groq**: Groq Cloud
- **deepseek**: DeepSeek API
- **perplexity**: Perplexity AI
- **xai**: X.AI (Grok)
- **cohere**: Cohere API

### Pass-Through Billing (PTB)
PTB allows Helicone to handle billing on behalf of users. Endpoints with `ptbEnabled: true` support this feature. The system automatically filters and sorts PTB-enabled endpoints for cost optimization.

## Performance Considerations

- The registry builds indexes at module load time for O(1) lookups
- Endpoints are pre-sorted by cost during index building
- Type safety is enforced through TypeScript's `satisfies` operator
- All model and endpoint IDs are validated at compile time

## Testing

Run tests with:
```bash
cd packages/cost
yarn test
```

Key test files:
- `endpoint-selector.test.ts`: Tests endpoint filtering logic
- Registry tests validate model lookups and URL building

## Integration with Helicone

This cost model system integrates with:
- **Jawn Backend**: Uses registry for cost calculations and PTB decisions
- **Web Dashboard**: Displays model pricing and availability
- **Proxy Workers**: Routes requests based on endpoint configurations
- **Analytics**: Tracks usage and costs per model/provider

## Future Enhancements

- Dynamic pricing updates from provider APIs
- Performance metrics (latency, throughput) per endpoint
- Automatic failover between equivalent endpoints
- Cost optimization recommendations based on usage patterns