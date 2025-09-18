# OpenRouter Endpoint Integration Guide

This guide explains how to add OpenRouter fallback endpoints to model files with worst-case pricing for escrow.

## Overview

OpenRouter acts as a universal fallback provider with priority 3 (after BYOK=1 and PTB=2). Since OpenRouter dynamically routes to different providers with varying costs, we need to:
1. Find the worst-case (most expensive) endpoint for each model
2. Apply OpenRouter's 5.5% fee
3. Use this as placeholder pricing (actual cost comes from response)

## Step-by-Step Process

### 1. Find the OpenRouter Model ID

First, check if OpenRouter supports your model by searching their model list:

```bash
# Replace MODEL_NAME with your target model (e.g., gpt-4o, claude, qwen)
curl -s "https://openrouter.ai/api/v1/models" | \
  python3 -c "import json; import sys; data = json.load(sys.stdin); \
  models = [m for m in data['data'] if 'MODEL_NAME' in m['id'].lower()]; \
  for m in models[:10]: print(f\"{m['id']}: {m.get('name', 'N/A')}\")"
```

Example for qwen models:
```bash
curl -s "https://openrouter.ai/api/v1/models" | \
  python3 -c "import json; import sys; data = json.load(sys.stdin); \
  models = [m for m in data['data'] if 'qwen' in m['id'].lower()]; \
  for m in models[:5]: print(f\"{m['id']}: {m.get('name', 'N/A')}\")"
```

### 2. Get Model Context Length and Max Completion Tokens

Once you have the model ID, get its context length AND max completion tokens:

```bash
# Replace MODEL_ID with the actual model ID (e.g., qwen/qwen3-32b)
curl -s "https://openrouter.ai/api/v1/models" | \
  python3 -c "import json; import sys; data = json.load(sys.stdin); \
  for model in data['data']:
    if model['id'] == 'MODEL_ID':
      print(f\"Model: {model['id']}\")
      print(f\"Context length: {model.get('context_length', 'Not specified')}\")
      print(f\"Max completion tokens: {model.get('top_provider', {}).get('max_completion_tokens', 'Not specified')}\")
      break"
```

**IMPORTANT**: OpenRouter's `max_completion_tokens` may differ from `context_length`. Always check both!

### 3. Get Endpoint Pricing Information

Get all endpoints and their pricing to find the worst-case scenario:

```bash
# Replace MODEL_ID with the actual model ID (e.g., openai/gpt-4o)
curl -s "https://openrouter.ai/api/v1/models/MODEL_ID/endpoints" | \
  python3 -c "
import json; import sys
data = json.load(sys.stdin)
endpoints = data['data']['endpoints']

# Show all providers and their pricing sorted by cost
print('All endpoint pricing (sorted by prompt cost):')
sorted_endpoints = sorted(endpoints, key=lambda e: float(e['pricing']['prompt']), reverse=True)
for e in sorted_endpoints[:5]:
    prompt = float(e['pricing']['prompt'])
    completion = float(e['pricing']['completion'])
    print(f\"{e['provider_name']}: prompt=\${prompt:.10f} (\${prompt*1000000:.2f}/1M), completion=\${completion:.10f} (\${completion*1000000:.2f}/1M)\")
"
```

### 4. Find Worst-Case Pricing with Provider Names

This script finds the worst-case pricing and shows which providers have it:

```bash
# Replace MODEL_ID with your model (e.g., qwen/qwen3-32b)
curl -s "https://openrouter.ai/api/v1/models/MODEL_ID/endpoints" | \
  python3 -c "
import json; import sys
data = json.load(sys.stdin)
endpoints = data['data']['endpoints']

# Find worst-case pricing
max_prompt = max(float(e['pricing']['prompt']) for e in endpoints)
max_completion = max(float(e['pricing']['completion']) for e in endpoints)

# Find which providers have worst-case pricing
prompt_providers = [e['provider_name'] for e in endpoints if float(e['pricing']['prompt']) == max_prompt]
completion_providers = [e['provider_name'] for e in endpoints if float(e['pricing']['completion']) == max_completion]

# Calculate OpenRouter pricing (5.5% markup)
or_prompt = max_prompt * 1.055
or_completion = max_completion * 1.055

print(f'Model: {data[\"data\"][\"id\"]}')
print(f'\\nWorst-case prompt: \${max_prompt:.10f} (\${max_prompt*1000000:.2f}/1M)')
print(f'Providers: {', '.join(prompt_providers[:3])}')
print(f'\\nWorst-case completion: \${max_completion:.10f} (\${max_completion*1000000:.2f}/1M)')
print(f'Providers: {', '.join(completion_providers[:3])}')
print(f'\\nOpenRouter pricing with 5.5% markup:')
print(f'Input:  {or_prompt:.10f} (\${or_prompt*1000000:.2f}/1M)')
print(f'Output: {or_completion:.10f} (\${or_completion*1000000:.2f}/1M)')
"
```

### 5. Add to Endpoint File

Add the OpenRouter endpoint to the model's `endpoints.ts` file with the **exact comment format**:

```typescript
"model-name:openrouter": {
  providerModelId: "provider/model-name",  // From step 1
  provider: "openrouter",
  author: "author-name",  // Match the existing author in the file
  pricing: [
    {
      threshold: 0,
      input: 0.000000422,  // $0.42/1M - worst-case: $0.40/1M (ProviderName) * 1.055
      output: 0.000000844, // $0.84/1M - worst-case: $0.80/1M (ProviderName) * 1.055
    },
  ],
  contextLength: 40_960,  // From step 2 - use the model's actual context length
  maxCompletionTokens: 40_960,  // Usually same as contextLength
  supportedParameters: [
    // Copy from similar endpoints or use common OpenRouter params
    "frequency_penalty",
    "logprobs",
    "max_tokens",
    "presence_penalty",
    "seed",
    "stop",
    "temperature",
    "tool_choice",
    "tools",
    "top_logprobs",
    "top_p",
  ],
  ptbEnabled: true,  // IMPORTANT: Keep this true for fallback endpoints
  priority: 3,  // Fallback priority (after BYOK=1 and PTB=2)
  endpointConfigs: {
    "*": {},
  },
},
```

### Comment Format Rules

The pricing comment **MUST** follow this exact format:
```typescript
input: 0.000000422,  // $X.XX/1M - worst-case: $Y.YY/1M (Provider1/Provider2) * 1.055
output: 0.000000844, // $X.XX/1M - worst-case: $Y.YY/1M (Provider1/Provider2) * 1.055
```

Where:
- **$X.XX/1M** = Final price per million tokens (with 5.5% markup)
- **$Y.YY/1M** = Original worst-case price per million tokens
- **(Provider1/Provider2)** = Actual provider names with worst-case pricing (max 2-3 names)
- **\* 1.055** = The markup calculation

## Complete Example: Adding qwen3-32b

```bash
# 1. Find model
curl -s "https://openrouter.ai/api/v1/models" | grep -i "qwen3-32b"
# Output: "id": "qwen/qwen3-32b"

# 2. Get context length
curl -s "https://openrouter.ai/api/v1/models" | \
  python3 -c "import json; import sys; data = json.load(sys.stdin); \
  for m in data['data']:
    if m['id'] == 'qwen/qwen3-32b':
      print(f\"Context: {m.get('context_length')}\")"
# Output: Context: 40960

# 3. Get worst-case pricing
curl -s "https://openrouter.ai/api/v1/models/qwen/qwen3-32b/endpoints" | \
  python3 -c "
import json; import sys
data = json.load(sys.stdin)
endpoints = data['data']['endpoints']
sorted_by_prompt = sorted(endpoints, key=lambda e: float(e['pricing']['prompt']), reverse=True)
print('Top 3 most expensive (by prompt):')
for e in sorted_by_prompt[:3]:
    print(f\"{e['provider_name']}: \${float(e['pricing']['prompt'])*1000000:.2f}/1M prompt, \${float(e['pricing']['completion'])*1000000:.2f}/1M completion\")
"
# Output:
# Cerebras: $0.40/1M prompt, $0.80/1M completion
# SambaNova: $0.40/1M prompt, $0.80/1M completion
```

Final endpoint:
```typescript
"qwen3-32b:openrouter": {
  providerModelId: "qwen/qwen3-32b",
  provider: "openrouter",
  author: "alibaba",
  pricing: [
    {
      threshold: 0,
      input: 0.000000422, // $0.42/1M - worst-case: $0.40/1M (Cerebras/SambaNova) * 1.055
      output: 0.000000844, // $0.84/1M - worst-case: $0.80/1M (Cerebras/SambaNova) * 1.055
    },
  ],
  contextLength: 40_960,
  maxCompletionTokens: 40_960,
  supportedParameters: [
    "frequency_penalty",
    "logprobs",
    "max_tokens",
    "presence_penalty",
    "seed",
    "stop",
    "temperature",
    "tool_choice",
    "tools",
    "top_logprobs",
    "top_p",
  ],
  ptbEnabled: true,
  priority: 3,
  endpointConfigs: {
    "*": {},
  },
},
```

## Important Notes

1. **Dynamic Pricing**: The prices we add are placeholders for escrow. The actual cost comes from OpenRouter's response `usage.cost` field.

2. **Context Length**: Use the model's actual context length from the models API, not the maximum from endpoints.

3. **ptbEnabled**: Always set to `true` for OpenRouter fallback endpoints.

4. **Provider Names**: List the actual providers (max 2-3) that have the worst-case pricing in the comment.

5. **Model Availability**: Not all models are available on OpenRouter. If a model isn't found, skip adding an OpenRouter endpoint for it.

6. **Tiered Pricing**: Some models have tiered pricing based on context length (e.g., Google Gemini models). OpenRouter may only report the base tier pricing, but you should:
   - Check the original provider's endpoint file for multiple pricing thresholds
   - Use the HIGHEST tier pricing for worst-case escrow calculation
   - Example: Gemini-2.5-pro costs $1.25/1M for <200K tokens but $2.50/1M for >200K tokens
   - Always use the higher tier for OpenRouter fallback to ensure sufficient escrow

## Troubleshooting

If the pricing looks wrong (e.g., $0.00/1M), check:
1. The model ID is correct
2. The endpoints API is returning data
3. Try the raw curl command to see the actual response

If providers show as "Unknown" or blank, the float conversion might be failing. Use the string values directly from the JSON instead.