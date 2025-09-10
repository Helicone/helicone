# AI Gateway Architecture Reference

## Overview

The AI Gateway routes LLM requests through multiple providers with failover support, handling both BYOK (Bring Your Own Key) and PTB (Pass-Through-Billing) authentication.

## Core Pattern: Attempt-based Routing with Fallback

### Key Types

The architecture centers around the `Attempt` type which wraps an `Endpoint` with authentication details:

```typescript
interface Attempt {
  endpoint: Endpoint; // The compiled endpoint from registry
  providerKey: ProviderKey; // The actual API key to use
  authType: "byok" | "ptb"; // BYOK = user's key, PTB = Helicone's key
  priority: number; // Sort order (1=BYOK, 2=PTB)
  needsEscrow: boolean; // PTB needs escrow reservation
  source: string; // For debugging: "gpt-4/openai/byok"
}

interface Endpoint {
  baseUrl: string; // Where to send the request
  provider: ModelProviderName; // Which provider (openai, anthropic, etc.)
  providerModelId: string; // Model identifier at provider
  pricing: ModelPricing[]; // Cost calculation
  contextLength: number; // Max input tokens
  maxCompletionTokens: number; // Max output tokens
  ptbEnabled: boolean; // Can use PTB for this endpoint
  supportedParameters: StandardParameter[]; // What parameters this endpoint accepts
}
```

### Error Handling with Result Type

All async operations use the `Result<T, K>` pattern from `/lib/util/results.ts`:

```typescript
type Result<T, K> = SuccessResult<T> | ErrorResult<K>

interface SuccessResult<T> {
  data: T
  error: null
}

interface ErrorResult<K> {
  data: null
  error: K
}

// Helper functions
ok<T, K>(data: T): Result<T, K>
err<T, K>(error: K): Result<T, K>
isErr<T, K>(result: Result<T, K>): boolean
```

## Existing Components to Reuse

### Registry Methods (Already Sorted by Cost!)

```typescript
registry.getPtbEndpoints(model, provider)  // Returns PTB endpoints sorted by cost
registry.getEndpointsByModel(model)        // Returns all endpoints sorted by cost
registry.getModelProviders(model)          // Returns Set<Provider> for auto-detect
registry.createPassthroughEndpoint(...)    // Creates dynamic endpoint for unknown models
registry.buildEndpoint(config, userConfig) // Builds endpoint with user config
```

### Provider Helpers

```typescript
buildRequestBody(endpoint, context); // Handles provider-specific transforms
authenticateRequest(endpoint, context); // Provider-specific auth (Bearer, x-api-key, etc)
buildEndpointUrl(config, userConfig); // Builds URL with region/deployment
buildModelId(config, userConfig); // Provider-specific model ID
```

### Existing Utilities

```typescript
enableStreamUsage(wrapper, bodyMapping); // Adds stream_options.include_usage
toAnthropic(body); // OpenAI → Anthropic transform
isByokEnabled(providerKey); // Checks if BYOK is enabled
getBody(requestWrapper); // Parses body with stream usage
authenticate(wrapper, env, store); // API key validation
```

### Cost/Escrow Management

```typescript
reserveEscrow(wrapper, env, orgId, endpoint); // Handles worst-case calculation
wallet.cancelEscrow(escrowId); // Already wrapped in catch
wallet.getDisallowList(); // Get blocked models
```

## Current Architecture

### 1. SimpleAIGateway Class

Main orchestrator with a clear linear flow. Handles the complete request lifecycle.

**Key responsibilities:**

- Authenticate API key using APIKeysManager
- Parse request body and extract model strings
- Expand prompts if prompt_id is present (lazy initialization)
- Build all possible attempts via AttemptBuilder
- Check disallow list from wallet
- Try each attempt in order until one succeeds
- Return first successful response or error summary

### 2. AttemptBuilder Class

Builds a flat list of attempts from model strings. Handles both BYOK and PTB logic.

**Key responsibilities:**

- Parse model spec (model/provider/uid format)
- Check for BYOK keys in provider store
- Get PTB endpoints from registry
- Merge user config with provider keys
- Return sorted list (BYOK priority=1, PTB priority=2)
- Each attempt contains all info needed for execution

### 3. AttemptExecutor Class

Executes a single attempt with proper error handling and escrow management.

**Key responsibilities:**

- Reserve escrow for PTB attempts
- Build request body using provider helpers
- Authenticate request with provider-specific headers
- Forward request through gateway forwarder
- Cancel escrow on failure using ctx.waitUntil
- Return response or throw error for retry

## Request Flow

```
SimpleAIGateway.handle():
├─ 1. Authenticate (returns Result<{orgId, apiKey}, Response>)
│     └─ Validate API key → Get org ID
├─ 2. Parse Request (returns Result<{modelStrings, body}, Response>)
│     └─ Extract model string → Split by comma
├─ 3. Expand Prompts (conditional, returns Result<{body}, Response>)
│     └─ Only if prompt_id present → Merge with template
├─ 4. Build Attempts (AttemptBuilder)
│     ├─ For each model string:
│     │   ├─ Parse spec (model/provider/uid)
│     │   ├─ Check BYOK keys
│     │   └─ Get PTB endpoints
│     └─ Return sorted attempts[]
├─ 5. Get Disallow List
│     └─ Fetch from wallet durable object
└─ 6. Execute Attempts (loop)
      ├─ For each attempt:
      │   ├─ Check disallow list
      │   ├─ AttemptExecutor.execute():
      │   │   ├─ Reserve escrow (PTB only)
      │   │   ├─ Build request body
      │   │   ├─ Authenticate headers
      │   │   └─ Forward request
      │   ├─ On success → Return response
      │   └─ On failure → Cancel escrow, try next
      └─ All failed → Error response with details
```

## Implementation Status

### ✅ Completed Components

#### Core Types

- ✅ Created types.ts with Attempt interface
- ✅ Import existing types from cost package
- ✅ Added DisallowListEntry and EscrowInfo types

#### AttemptBuilder

- ✅ Created AttemptBuilder.ts class
- ✅ Implemented parseModelSpec() method
- ✅ Implemented buildAttempts() method
- ✅ Added BYOK key checking logic
- ✅ Added PTB endpoint fetching
- ✅ Added provider key merging
- ✅ Added priority sorting (BYOK=1, PTB=2)

#### AttemptExecutor

- ✅ Created AttemptExecutor.ts class
- ✅ Implemented execute() method
- ✅ Added escrow reservation for PTB
- ✅ Integrated buildRequestBody from provider-helpers
- ✅ Integrated authenticateRequest from provider-helpers
- ✅ Added error handling with escrow cleanup
- ✅ Used ctx.waitUntil for cleanup

#### SimpleAIGateway

- ✅ Created SimpleAIGateway.ts main class
- ✅ Implemented handle() method with Result types
- ✅ Reused authenticate() logic
- ✅ Added getBody() for request parsing
- ✅ Added model string comma-split parsing
- ✅ Integrated lazy prompt expansion
- ✅ Added disallow list checking
- ✅ Implemented failover loop
- ✅ Added error response formatting

#### Router Integration

- ✅ Created router.ts entry point
- ✅ Wired up dependencies
- ✅ Set request referrer to "ai-gateway"
- ✅ Exported getAIGatewayRouter function

## Key Design Principles

1. **No Mutations**: Use immutable patterns where possible
2. **Reuse Existing Code**: Don't recreate what already works
3. **Clear Separation**: Routing logic vs execution logic
4. **Simple Orchestration**: Thin coordination layer
5. **Proper Cleanup**: Always handle escrow cancellation

## Actual Lines of Code

- types.ts: ~50 lines
- AttemptBuilder.ts: ~180 lines
- AttemptExecutor.ts: ~165 lines
- SimpleAIGateway.ts: ~307 lines
- router.ts: ~20 lines
- **Total: ~722 lines** (similar to original but much cleaner)

## Benefits Over Original Implementation

1. **Linear Flow**: Simple top-to-bottom execution path in SimpleAIGateway
2. **Clear Separation**: Attempt building vs execution are distinct phases
3. **Consistent Error Handling**: Result<T, K> type throughout
4. **Reuses Existing Code**: Leverages registry, provider helpers, and utilities
5. **Maintainable**: Each class has a single, clear responsibility
6. **No Over-engineering**: Simple classes without unnecessary abstractions
7. **Debuggable**: Each attempt has a source string for tracing
