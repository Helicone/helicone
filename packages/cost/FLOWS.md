# Helicone Model Registry Flows

This document explains the request routing logic and priority system in Helicone's model registry.

## Core Concepts

- **PTB (Pass-Through Billing)**: Helicone manages API keys and bills users for usage
- **BYOK (Bring Your Own Key)**: Users provide their own API keys and are billed directly by providers
- **Provider**: A service that hosts models (e.g., Anthropic, AWS Bedrock, Vertex AI)
- **Endpoint**: A specific deployment of a model (e.g., Bedrock us-east-1, Vertex us-central1)

## Request Routing Priority

### The Golden Rule

**All BYOK endpoints are attempted first (sorted by cost), then all PTB endpoints (sorted by cost).**

### Priority Flow

```
User Request: "claude-3.5-haiku"
    ↓
1. Identify Available Providers
   [Anthropic, Bedrock, Vertex]
    ↓
2. Phase 1: Try ALL BYOK endpoints (sorted by cost)
   - Check which providers user has keys for
   - Sort BYOK endpoints by cost
   - Attempt each BYOK endpoint in order:
     • Success? → Return response ✓
     • Failed? → Try next BYOK endpoint
   - All BYOK exhausted? → Continue to Phase 2
    ↓
3. Phase 2: Try ALL PTB endpoints (sorted by cost)
   - Get all PTB-enabled endpoints
   - Filter out providers marked as byok_only
   - Sort PTB endpoints by cost
   - Attempt each PTB endpoint in order:
     • Success? → Return response ✓
     • Failed? → Try next PTB endpoint
    ↓
4. All endpoints exhausted → Return error
```

## Key Behaviors

### 1. Two-Phase Approach

- **Phase 1**: All BYOK endpoints (sorted by cost)
- **Phase 2**: All PTB endpoints (sorted by cost)
- BYOK endpoints are ALWAYS exhausted before trying ANY PTB endpoint

### 2. Per-Provider BYOK-Only Mode

- The `byok_only` flag is **per-provider**, not per-model
- When set to `true`, that provider is excluded from Phase 2 (PTB)
- Example: User sets `byok_only: true` for Anthropic
  - Phase 1: Anthropic BYOK is attempted (if user has key)
  - Phase 2: Anthropic PTB is SKIPPED, but Bedrock/Vertex PTB still available

### 3. Cost-Based Sorting Within Each Phase

- BYOK endpoints sorted by their associated costs
- PTB endpoints sorted by their pricing
- Cheapest options attempted first within each phase

## Example Scenarios

### Scenario 1: Mixed BYOK and PTB

```
Model: claude-3.5-haiku
User Keys: {anthropic: configured, bedrock: configured}
Costs: anthropic < bedrock < vertex

Phase 1 - BYOK (sorted by cost):
1. anthropic (BYOK) - $0.25/1K → Try user's Anthropic key
2. bedrock (BYOK) - $0.30/1K → Try user's Bedrock key

Phase 2 - PTB (sorted by cost):
3. anthropic (PTB) - $0.25/1K → Try Helicone's Anthropic key
4. bedrock (PTB) - $0.30/1K → Try Helicone's Bedrock key
5. vertex (PTB) - $0.35/1K → Try Helicone's Vertex key
```

### Scenario 2: BYOK-only for specific provider

```
Model: claude-3.5-haiku
User Keys: {
  anthropic: {key: "sk-ant-...", byok_only: true},
  bedrock: {key: "AKIA...", byok_only: false}
}

Phase 1 - BYOK:
1. anthropic (BYOK) → Try user's key
2. bedrock (BYOK) → Try user's key

Phase 2 - PTB:
3. bedrock (PTB) → Try Helicone's key
4. vertex (PTB) → Try Helicone's key
(Anthropic PTB skipped due to byok_only=true)
```

### Scenario 3: No BYOK keys configured

```
Model: claude-3.5-haiku
User Keys: None configured

Phase 1 - BYOK:
(Skip - no user keys)

Phase 2 - PTB (sorted by cost):
1. anthropic (PTB) - $0.25/1K → Try first (cheapest)
2. bedrock (PTB) - $0.30/1K → Try if anthropic fails
3. vertex (PTB) - $0.35/1K → Try if bedrock fails
```

### Scenario 4: All BYOK with some byok_only

```
Model: gpt-4
User Keys: {
  openai: {key: "sk-...", byok_only: false},
  azure-openai: {key: "...", byok_only: true},
  bedrock: {key: "...", byok_only: true}
}

Phase 1 - BYOK (all attempted):
1. openai (BYOK) → Try user's OpenAI key
2. azure-openai (BYOK) → Try user's Azure key
3. bedrock (BYOK) → Try user's Bedrock key

Phase 2 - PTB (filtered):
4. openai (PTB) → Only OpenAI PTB available
(Azure and Bedrock PTB skipped due to byok_only=true)
```

## Model String Formats

### Format 1: Model only

```
"claude-3.5-haiku"
→ Try all providers in cost order
```

### Format 2: Model/Provider

```
"claude-3.5-haiku/bedrock"
→ Only try Bedrock provider
```

### Format 3: Model/Provider/Deployment

```
"claude-3.5-haiku/bedrock/us-west-2"
→ Try Bedrock us-west-2 specifically
```

## Data Architecture & Type System

### How Data is Organized

The registry uses a hierarchical structure to manage model configurations:

```
Registry
  ├── ModelProviderConfig (Base Template)
  │   ├── Provider (e.g., "bedrock")
  │   ├── Model ID (e.g., "anthropic.claude-3-5-haiku")
  │   ├── Pricing (base costs)
  │   ├── Context limits
  │   └── EndpointConfigs (deployment variations)
  │       ├── "us-east-1": { regional overrides }
  │       └── "us-west-2": { regional overrides }
  │
  └── Endpoint (Resolved Instance)
      ├── Everything from ModelProviderConfig
      ├── Specific deployment merged
      ├── baseUrl (fully constructed)
      └── ptbEnabled flag
```

### Key Types and Their Roles

#### 1. **ModelProviderConfig** (Template)

- The blueprint for a model/provider combination
- Contains base configuration and all possible deployment variations
- Stored statically in `/authors/{provider}/` files
- Used to generate both BYOK and PTB endpoints

#### 2. **Endpoint** (Runtime Instance)

- A resolved, ready-to-use configuration
- Created by merging ModelProviderConfig + specific deployment
- Contains the actual URL, headers, and pricing
- Has `ptbEnabled` flag determining billing mode

#### 3. **ProviderKey** (User Configuration)

- User's stored API credentials
- Contains `byok_only` flag for PTB exclusion
- Includes provider-specific config (regions, resource names)
- Retrieved from database at request time

### How Types Support the Two-Phase Flow

```
Phase 1 (BYOK):
1. Query DB for ProviderKeys → Get user's credentials
2. Use ModelProviderConfig as template
3. Merge with user's config → Create BYOK Endpoint
4. Set ptbEnabled = false
5. Attempt request with user's key

Phase 2 (PTB):
1. Get pre-built PTB Endpoints from registry
2. Filter out providers where byok_only = true
3. These already have ptbEnabled = true
4. Attempt request with Helicone's keys
```
