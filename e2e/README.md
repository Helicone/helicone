# Helicone E2E Tests

End-to-end integration tests for the Helicone AI Gateway.

## Overview

This test suite validates the Helicone AI Gateway functionality by making real HTTP requests to the gateway running on port 8793.

## Prerequisites

- Node.js 20+
- Yarn
- Helicone AI Gateway running on port 8793

## Getting Started

### 1. Install Dependencies

```bash
cd e2e
yarn install
```

### 2. Start the Gateway

From the root of the Helicone project:

```bash
cd worker
npx wrangler dev --var WORKER_TYPE:AI_GATEWAY_API --port 8793 --test-scheduled
```

Or use the convenience script:

```bash
./worker/run_all_workers.sh
```

### 3. Run Tests

```bash
# Run all tests
yarn test

# Run gateway tests only
yarn test:gateway

# Run in watch mode
yarn test:watch

# Run with coverage
yarn test:coverage
```

## Configuration

Create a `.env` file in the `e2e` directory to customize settings:

```bash
GATEWAY_URL=http://localhost:8793
```

## Test Structure

```
e2e/
├── lib/                    # Shared utilities
│   ├── constants.ts        # Test constants and config
│   ├── http-client.ts      # HTTP client wrapper
│   └── test-helpers.ts     # Common test helpers
├── tests/
│   ├── setup.ts            # Jest setup file
│   └── gateway/            # Gateway-specific tests
│       ├── health.test.ts          # Health check tests
│       └── chat-completion.test.ts # Chat completion tests
├── jest.config.ts          # Jest configuration
├── tsconfig.json           # TypeScript configuration
└── package.json
```

## Writing Tests

### Example Test

```typescript
import { gatewayClient } from "../../lib/http-client";
import { GATEWAY_ENDPOINTS } from "../../lib/constants";
import { createChatCompletionRequest } from "../../lib/test-helpers";

describe("My Feature", () => {
  it("should work correctly", async () => {
    const requestBody = createChatCompletionRequest({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: "Hello" }],
    });

    const response = await gatewayClient.post(
      GATEWAY_ENDPOINTS.CHAT_COMPLETIONS,
      requestBody
    );

    expect(response.status).toBe(200);
  });
});
```

## Available Test Utilities

### HTTP Client

```typescript
import { gatewayClient } from "../../lib/http-client";

// Make requests
await gatewayClient.post("/endpoint", data);
await gatewayClient.get("/endpoint");

// Custom headers
gatewayClient.setHeaders({ "X-Custom": "value" });
gatewayClient.resetHeaders();
```

### Test Helpers

```typescript
import {
  createChatCompletionRequest,
  validateChatCompletionResponse,
  retry,
  sleep,
} from "../../lib/test-helpers";

// Create request body
const request = createChatCompletionRequest({
  model: "gpt-4o-mini",
  messages: [{ role: "user", content: "Hello" }],
});

// Validate response
validateChatCompletionResponse(response);

// Retry with backoff
await retry(() => apiCall(), { maxAttempts: 3 });
```

## Troubleshooting

### Gateway Not Running

If tests fail with connection errors:

1. Ensure the gateway is running: `npx wrangler dev --var WORKER_TYPE:AI_GATEWAY_API --port 8793`
2. Check the port is correct: `lsof -i :8793`
3. Verify the gateway URL in `.env`

### Timeout Errors

If tests timeout:

1. Increase timeout in `jest.config.ts`: `testTimeout: 60000`
2. Check gateway logs for errors
3. Verify network connectivity

### Authentication Errors

Tests use mock authentication headers. If you see auth errors:

1. Check `lib/constants.ts` for header configuration
2. Verify the gateway is configured for local testing
3. Update test headers as needed

## CI/CD Integration

Add to your CI pipeline:

```yaml
- name: Install E2E dependencies
  run: cd e2e && yarn install

- name: Start Gateway
  run: |
    cd worker
    npx wrangler dev --var WORKER_TYPE:AI_GATEWAY_API --port 8793 &
    sleep 10

- name: Run E2E tests
  run: cd e2e && yarn test
```
