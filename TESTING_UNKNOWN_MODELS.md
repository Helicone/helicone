# Testing Unknown Model Fallback Feature

## Overview
This guide explains how to test the fix for issue #5544: Fallback for unsupported model versions.

## What Changed
Previously, the AI Gateway would return a 500 error when encountering an unknown model version. Now, when a provider is explicitly specified (e.g., `new-model-v2/openai`), the gateway will attempt to proxy the request to the target API even if the model is not in Helicone's registry.

## Code Changes

### 1. `packages/cost/models/provider-helpers.ts`
- Modified `parseModelString` to allow unknown models when a provider is specified
- Previously: Unknown models without providers would fail
- Now: Unknown models WITH providers are allowed (for passthrough)

### 2. `worker/src/lib/ai-gateway/AttemptBuilder.ts`
- Added logging when attempting passthrough for unknown models
- Enhanced error messages for better debugging
- Improved passthrough attempt handling

## Manual Testing Steps

### Prerequisites
1. Start the Helicone development environment:
   ```bash
   ./helicone-compose.sh helicone up
   cd web && yarn dev:better-auth
   cd valhalla/jawn && yarn dev
   ```

2. Configure provider API keys in Supabase (provider_keys table)

### Test Case 1: Unknown OpenAI Model Version
**Expected:** Request should be proxied to OpenAI API even though model is not in registry

```bash
curl -X POST http://localhost:8787/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-helicone-api-key>" \
  -d '{
    "model": "gpt-5-turbo-preview/openai",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```

**Expected Result:**
- Request is proxied to OpenAI API
- Console logs show: `Model "gpt-5-turbo-preview" not found in registry, attempting passthrough to openai`
- If the model exists on OpenAI's side: Success response
- If OpenAI returns an error: That error is returned to the user (not a Helicone 500 error)

### Test Case 2: Unknown Anthropic Model Version
**Expected:** Request should be proxied to Anthropic API

```bash
curl -X POST http://localhost:8787/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-helicone-api-key>" \
  -d '{
    "model": "claude-4-opus-20250301/anthropic",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```

**Expected Result:**
- Request is proxied to Anthropic API (converted to Anthropic format)
- Console logs show passthrough attempt
- Anthropic's actual error (if model doesn't exist) is returned to user

### Test Case 3: Unknown Model WITHOUT Provider
**Expected:** Should return helpful error message asking user to specify provider

```bash
curl -X POST http://localhost:8787/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-helicone-api-key>" \
  -d '{
    "model": "unknown-model-12345",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```

**Expected Result:**
- Returns 400 error
- Error message: "Unknown model: unknown-model-12345. Please specify a provider (e.g., unknown-model-12345/openai) or use a supported model."

### Test Case 4: Fallback from Unknown to Known Model
**Expected:** Try unknown model first, fallback to known model on error

```bash
curl -X POST http://localhost:8787/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-helicone-api-key>" \
  -d '{
    "model": "gpt-5-experimental/openai,gpt-4o/openai",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```

**Expected Result:**
- First attempts `gpt-5-experimental/openai` (likely fails)
- Falls back to `gpt-4o/openai` (should succeed)
- Returns successful response from gpt-4o

### Test Case 5: Multiple Unknown Models with Fallback
**Expected:** Try each model in sequence until one succeeds

```bash
curl -X POST http://localhost:8787/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-helicone-api-key>" \
  -d '{
    "model": "fake-model-1/openai,fake-model-2/anthropic,gpt-4o/openai",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```

**Expected Result:**
- Tries `fake-model-1/openai` (fails)
- Tries `fake-model-2/anthropic` (fails)
- Falls back to `gpt-4o/openai` (succeeds)

## Verification Checklist

- [ ] Unknown models with providers are proxied (not rejected with 500)
- [ ] Unknown models without providers show helpful error message
- [ ] Fallback mechanism works (tries next model on failure)
- [ ] Console logs show passthrough attempts
- [ ] Requests are properly logged in Helicone
- [ ] Provider errors are passed through to users (not masked by Helicone)
- [ ] Known models still work as expected (no regression)

## Automated Tests

### Model Parser Tests (✅ Passing)
```bash
cd packages && npx jest __tests__/cost/model-parser.test.ts
```

Tests verify that:
- Unknown models without providers are rejected
- Unknown models WITH providers are accepted
- Model name mappings still work
- :online suffix handling works

## Implementation Notes

### Logging
The implementation adds console.log statements for debugging:
- When a model is not found in registry
- When creating a passthrough endpoint
- When passthrough fails

These logs help understand what's happening during development and debugging.

### No Breaking Changes
This change is backwards compatible:
- Known models work exactly as before
- Unknown models without providers still show helpful error (no change)
- NEW: Unknown models WITH providers now work via passthrough (instead of 500 error)

## Success Criteria

✅ **Issue #5544 is resolved when:**
1. Gateway does NOT return 500 for unknown models with providers
2. Gateway attempts to proxy request to target API
3. Logging shows passthrough attempts
4. Model parser tests pass
5. Manual tests confirm passthrough behavior works
