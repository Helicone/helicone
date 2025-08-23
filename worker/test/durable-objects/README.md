# Durable Object Testing Guide

## Overview
Durable Object tests have known issues with the vitest testing infrastructure due to:
1. **DO Invalidation**: File change detection causes Durable Objects to reset mid-test
2. **Module Resolution**: Supabase dependencies cause `node:punycode` import errors
3. **State Persistence**: DO state doesn't persist properly across test runs

## Test Structure

### ✅ Working Tests (Run in CI)
- `rate-limiter-mock.test.ts` - Mock implementation validating core logic
- `rate-limiter-simple.test.ts` - Unit tests for rate limiting algorithms
- These tests validate the rate limiting logic without DO infrastructure

### ⚠️ Manual Tests (Skip in CI)
- `rate-limit-2.spec.ts` - Integration tests requiring actual DO instances
- `rate-limiter.test.ts` - Direct DO access tests (has import issues)

## Manual Testing Process

### 1. Start Wrangler Dev Server
```bash
npx wrangler dev --local --persist
```

### 2. Test Rate Limiting Manually

#### Request-based Rate Limiting
```bash
# First request - should succeed
curl -X POST https://localhost:8787/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Helicone-Auth: Bearer sk-helicone-test" \
  -H "Helicone-RateLimit-Policy: 2;w=60;u=request;s=user" \
  -H "Helicone-User-Id: test-user-1" \
  -d '{"model": "gpt-4", "messages": [{"role": "user", "content": "test"}]}'

# Second request - should succeed
# Third request - should return 429
```

#### Cents-based Rate Limiting
```bash
# Set a 10 cents quota
curl -X POST https://localhost:8787/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Helicone-Auth: Bearer sk-helicone-test" \
  -H "Helicone-RateLimit-Policy: 10;w=60;u=cents;s=user" \
  -H "Helicone-User-Id: test-user-2" \
  -d '{"model": "gpt-4", "messages": [{"role": "user", "content": "test"}]}'

# Check the Helicone-RateLimit-Remaining header
# It should decrease based on actual cost
```

### 3. Verify Headers
Check these response headers:
- `Helicone-RateLimit-Limit`: The quota limit
- `Helicone-RateLimit-Remaining`: Remaining quota
- `Helicone-RateLimit-Policy`: Should include segment (e.g., `s=user`)

## Running Specific Test Suites

```bash
# Run only the working mock tests
yarn test rate-limiter-mock rate-limiter-simple

# Run all tests (including skipped ones)
yarn test

# Debug specific test file
yarn test:debug rate-limit-2 --run
```

## Known Issues & Solutions

### Issue 1: Durable Object Invalidation
**Error**: `Error: /src/index.ts changed, invalidating this Durable Object`
**Solution**: Tests must be run with wrangler dev, not vitest

### Issue 2: Module Resolution
**Error**: `No such module "node:punycode"`
**Solution**: Mock tests avoid importing the actual DO class

### Issue 3: Test Timeouts
**Error**: `Test timed out in 5000ms`
**Solution**: DO calls fail due to invalidation, use manual testing

## CI Configuration
The GitHub Actions workflow skips DO integration tests automatically.
Only the mock and logic tests run in CI to ensure stability.

## Future Improvements
1. **Dependency Injection**: Refactor RateLimiterDO to accept Supabase as injected dependency
2. **Wrangler Test Mode**: Create separate test suite using wrangler's test capabilities
3. **Staging Tests**: Add integration tests that run against deployed staging DOs
4. **E2E Tests**: Use Playwright for full end-to-end testing with real browser requests