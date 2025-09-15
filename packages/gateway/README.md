# @helicone/gateway

Core gateway logic for the Helicone proxy, extracted from the Cloudflare Worker implementation for reusability across different platforms and services.

## Installation

```bash
npm install @helicone/gateway
```

## Usage

```typescript
import { 
  ok, 
  err, 
  Result,
  withTimeout,
  getModelFromRequest 
} from '@helicone/gateway';

// Use Result type for safe error handling
function processRequest(): Result<string, string> {
  if (success) {
    return ok("Success!");
  }
  return err("Failed to process");
}

// Use utility functions
const result = await withTimeout(fetchData(), 5000);
const model = getModelFromRequest(requestBody, path);
```

## Architecture

This package is organized in a bottom-up architecture with the following structure:

### Phase 1: Core Utilities (✅ Complete)
- **Result types**: Safe error handling with `Result<T, E>` type
- **Constants**: Internal error codes and constants
- **Helpers**: Pure utility functions (timeout, compression, model extraction)

### Upcoming Phases
- Phase 1.1: Response Building
- Phase 1.2: Provider Client Basics
- Phase 1.3: Stream Foundations
- Phase 1.4: Request/Response Types
- Phase 1.5: Provider Communication
- Phase 2: Stream Processing
- Phase 3: Request Handling
- Phase 4: Cache Layer
- Phase 5: Rate Limiting
- Phase 6: Security & Moderation
- Phase 7: Logging Pipeline
- Phase 8: Proxy Orchestration

## Development

```bash
# Build the package
npm run build

# Run tests
npm test

# Clean build artifacts
npm run clean
```

## Migration Status

See [WORKER_LOGIC_MOVE.md](../../WORKER_LOGIC_MOVE.md) for the complete migration plan and status.