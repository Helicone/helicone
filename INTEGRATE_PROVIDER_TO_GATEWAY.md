# How to integrate a new model provider to the AI Gateway

This tutorial explains how to add support for a new model provider in Helicone's AI Gateway.

## Overview

Adding a new provider to Helicone involves several key components:

- **Authors**: Companies that create the models (e.g., OpenAI, Anthropic)
- **Models**: Individual model definitions with pricing and metadata
- **Providers**: Inference providers that host models (e.g., OpenAI, Vertex AI, DeepInfra, Bedrock)
- **Endpoints**: Model-provider combinations with deployment configurations

## Prerequisites

- OpenAI-compatible API (recommended for simplest integration)
- Access to provider's pricing and inference documentation
- Model specifications (context length, supported features)
- API authentication details

## Step 1: Understanding the File Structure

All model support configurations are located in the `packages/cost/models` directory:

```
packages/cost/models/
├── authors/           # Model creators (companies)
├── providers/         # Inference providers
├── build-indexes.ts   # Builds maps for easy data access
├── calculate-cost.ts  # Cost calculation utilities
├── provider-helpers.ts # Helper methods
└── registry-types.ts  # Type definitions (requires updates)

```

## Step 2: Create Provider Definition

We will use `DeepInfra` as our example.

### For OpenAI-Compatible Providers

Create a new file in `packages/cost/models/providers/[provider-name].ts`:

```tsx
import { BaseProvider } from "./base";

export class DeepInfraProvider extends BaseProvider {
  readonly displayName = "DeepInfra";
  readonly baseUrl = "https://api.deepinfra.com/";
  readonly auth = "api-key" as const;
  readonly pricingPages = ["https://deepinfra.com/pricing/"];
  readonly modelPages = ["https://deepinfra.com/models/"];

  buildUrl(): string {
    return `${this.baseUrl}v1/openai/chat/completions`;
  }
}
```

Make sure to look up the correct endpoints and override anything that is not OpenAI API default.

This handles auth because the `BaseProvider` class handles the standard `Bearer ${apiKey}` authentication pattern automatically when you set `auth = "api-key"`, which is the common pattern for OpenAI-compatible APIs.

### For Non-OpenAI Compatible Providers

For non-OpenAI compatible providers, you'll need to override additional methods. You can find options by reviewing the `BaseProvider` definition.

```tsx
export class CustomProvider extends BaseProvider {
  // ... basic configuration

  buildBody(request: any): any {
    // Custom body transformation logic
    return transformedRequest;
  }

  buildHeaders(authContext: AuthContext): Record<string, string> {
    // Custom header logic
    return customHeaders;
  }
}

```

## Step 3: Add Provider to Index

Update `packages/cost/models/providers/index.ts`:

```tsx
import { DeepInfraProvider } from "./deepinfra";

export const providers = [
	/// ...
	deepinfra: new DeepInfraProvider(),
]
```

## Step 4: Add Provider to the Web's Data

Update `web/data/providers.ts` to include the new provider:

```tsx
...,
  {
    id: "deepinfra",
    name: "DeepInfra",
    logoUrl: "/assets/home/providers/deepinfra.webp",
    description: "Configure your DeepInfra API keys for fast and affordable inference",
    docsUrl: "https://docs.helicone.ai/getting-started/integration-methods",
    apiKeyLabel: "DeepInfra API Key",
    apiKeyPlaceholder: "...",
    relevanceScore: 40,
  },
  ...
```

## Step 5: Define Authors (Model Creators)

Create author definitions in `packages/cost/models/authors/[author-name]/`:

### Folder Structure

```
authors/mistralai/         # Author name
└── mistralai3             # Model family
	└── endpoints.ts    # Model-provider combinations
	└── models.ts       # Model definitions
└── index.ts          # Exports
└── metadata.ts       # Metadata about the author

```

### models.ts

Include the model within the `models` object. This can contain all model versions within that model family, in this case, the `mistral-nemo` model family.

Make sure to research each value and include the tokenizer in the `Tokenizer` interface type if it is not there already.

```tsx
import type { ModelConfig } from "../../../types";

export const models = {
  "mistral-nemo": {
    name: "Mistral: Mistral-Nemo",
    author: "mistralai",
    description:
      "The Mistral-Nemo-Instruct-2407 Large Language Model (LLM) is an instruct fine-tuned version of the Mistral-Nemo-Base-2407. Trained jointly by Mistral AI and NVIDIA, it significantly outperforms existing models smaller or similar in size.",
    contextLength: 128_000,
    maxOutputTokens: 16_400,
    created: "2024-07-18T00:00:00.000Z",
    modality: { inputs: ["text", "image"], outputs: ["text"] },
    tokenizer: "Tekken",
  },
} satisfies Record<string, ModelConfig>;

export type MistralNemoModelName = keyof typeof models;

```

### endpoints.ts

Now, update the `packages/models/[author]/[model-family]/endpoints.ts` file with model-provider endpoint combinations.

Make sure to review the provider's page itself since the inference cost changes per provider.

Make sure the initial key `"mistral-nemo:deepinfra"` is human-readable and friendly. It's what users will call!

```tsx
import { ModelProviderName } from "../../../providers";
import type { ModelProviderConfig } from "../../../types";
import { MistralNemoModelName } from "./models";

export const endpoints = {
  "mistral-nemo:deepinfra": {
    providerModelId: "mistralai/Mistral-Nemo-Instruct-2407",
    provider: "deepinfra",
    author: "mistralai",
    pricing: [
      {
        threshold: 0,
        input: 0.0000002,
        output: 0.0000004,
      },
    ],
    rateLimits: {
      rpm: 12000,
      tpm: 60000000,
      tpd: 6000000000,
    },
    contextLength: 128_000,
    maxCompletionTokens: 16_400,
    supportedParameters: [
      "max_tokens",
      "temperature",
      "top_p",
      "stop",
      "frequency_penalty",
      "presence_penalty",
      "repetition_penalty",
      "top_k",
      "seed",
      "min_p",
      "response_format",
    ],
    ptbEnabled: false,
    endpointConfigs: {
      "*": {},
    },
  }
} satisfies Partial<
  Record<`${MistralNemoModelName}:${ModelProviderName}` | MistralNemoModelName, ModelProviderConfig>
>;
```

Two important things to note here:

- Some providers have multiple deployment regions:

    ```tsx
    endpointConfigs: {
      "global": {
        pricing: [/* global pricing */],
        passThroughBillingEnabled: true,
      },
      "us-east": {
        pricing: [/* regional pricing */],
        passThroughBillingEnabled: true,
      },
    }

    ```

- Pricing Configuration

    ```tsx
    pricing: [
      {
        threshold: 0,              // Context length threshold
        inputCostPerToken: 0.0000005, // Always per million tokens
        outputCostPerToken: 0.0000015,
        cacheReadMultiplier: 0.1,   // Cache read cost (10% of input)
        cacheWriteMultiplier: 1.25, // Cache write cost (125% of input)
      },
      {
        threshold: 200000,         // Different pricing for >200k context
        inputCostPerToken: 0.000001,
        outputCostPerToken: 0.000003,
      },
    ],

    ```


## Step 6: Add model to Author registries (if needed)

If the model family hasn't been created, you will need to add it within the AI Gateway's registry.

### index.ts

Update `packages/cost/models/authors/[author]/index.ts` to include the new model family.

You don't need to update anything if the model family has already been created.

```jsx
/**
 * Mistral model registry aggregation
 * Combines all models and endpoints from subdirectories
 */

import type { ModelConfig, ModelProviderConfig } from "../../types";

// Import models
import { models as mistralNemoModels } from "./mistral-nemo/models";

// Import endpoints
import { endpoints as mistralNemoEndpoints } from "./mistral-nemo/endpoints";

// Aggregate models
export const mistralModels = {
  ...mistralNemoModels,
} satisfies Record<string, ModelConfig>;

// Aggregate endpoints
export const mistralEndpointConfig = {
  ...mistralNemoEndpoints,
} satisfies Record<string, ModelProviderConfig>;

```

### metadata.ts

Update `packages/cost/models/authors/[author]/metadata.ts` to fetch models.

You don't need to update anything if the author has already been created.

```jsx
/**
 * Mistral metadata
 */

import type { AuthorMetadata } from "../../types";
import { mistralModels } from "./index";

export const mistralMetadata = {
  modelCount: Object.keys(mistralModels).length,
  supported: true,
} satisfies AuthorMetadata;

```

## Step 7: Update the Model Registry & its Types

Add your new model to `packages/cost/models/registry-types.ts`:

```tsx
import { mistralEndpointConfig } from "./authors/mistralai";
import { mistralModels } from "./authors/mistralai";

const allModels = {
	...,
  ...mistralModels
};

const modelProviderConfigs = {
	...,
  ...mistralEndpointConfig
};
```

Add your new model to the `packages/cost/models/registry.ts`:

```tsx
import { mistralModels, mistralEndpointConfig } from "./authors/mistral";

const allModels = {
	//...
	  ...mistralModels
} satisfies Record<string, ModelConfig>;

const modelProviderConfigs = {
	// ...
	  ...mistralEndpointConfig
} satisfies Record<string, ModelProviderConfig>;
```

## Step 8: Create Tests

Create test files in `worker/tests/ai-gateway/` for the author.

You can use the tests there as a base example. Make sure to include all edge cases and error scenarios.

We map out the provider errors so we don't pass them to the user directly. You'll find the correct error codes in the `worker/src/lib/ai-gateway/SimpleAIGateway.ts` in the `createErrorResponse` [function here](https://github.com/Helicone/helicone/blob/bd88e063c66edcc1f617637facda9d9f2914e4f0/worker/src/lib/ai-gateway/SimpleAIGateway.ts#L349).

## Step 9: Snapshots

Make sure to rerun snapshots before deploying by running this command in your console.

`cd <your-path-to-the-repo>/helicone/helicone/packages && npx jest --updateSnapshot __tests__/cost/registrySnapshots.test.ts`

## Common Issues & Solutions

### Issue: Complex Authentication

**Solution**: Override the `auth()` method with custom logic:

```tsx
auth(authContext: AuthContext): ComplexAuth {
  return {
    "Authorization": `Bearer ${authContext.providerKeys?.custom}`,
    "X-Custom-Header": this.buildCustomHeader(authContext),
  };
}

```

### Issue: Non-Standard Request Format

**Solution**: Override the `buildBody()` method:

```tsx
buildBody(request: OpenAIRequest): CustomRequest {
  return {
    // Transform OpenAI format to provider format
    prompt: request.messages.map(m => m.content).join('\\n'),
    max_tokens: request.max_tokens,
  };
}

```

### Issue: Multiple Pricing Tiers

**Solution**: Use threshold-based pricing:

```tsx
pricing: [
  { threshold: 0, inputCostPerToken: 0.0000005 },
  { threshold: 100000, inputCostPerToken: 0.000001 },
  { threshold: 500000, inputCostPerToken: 0.000002 },
]

```

## Deployment Checklist

- [ ]  Provider class created with correct authentication
- [ ]  Models defined with accurate specifications
- [ ]  Endpoints configured with correct pricing
- [ ]  Registry types updated
- [ ]  Tests written and passing
- [ ]  Snapshots updated
- [ ]  Documentation updated
- [ ]  Pass-through billing tested (if applicable)
- [ ]  Fallback behavior verified
